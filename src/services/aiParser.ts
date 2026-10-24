import { forecastSpending } from './forecast';
import { localDate } from './date';
import { Account, Category, AiChatResponse, AppSettings, Transaction, RecurringTransaction, Budget } from '../types';

export function parseVietnameseFinancialCommand(
  text: string,
  accountNames: string[],
  categoryNames: string[],
  referenceDate = new Date()
): AiChatResponse {
  return parseNormalized(text, accountNames, categoryNames, referenceDate);
}

function parseNormalized(text: string, accountNames: string[], categoryNames: string[], referenceDate: Date): AiChatResponse {
  const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  let lower = text.toLowerCase().trim();
  const plain = normalize(lower);
  const clarification = (question: string): AiChatResponse => ({intent:'clarify', needs_confirmation:false, analysis:question, clarification_question:question, commands:[]});
  if (/(hang thang|dinh ky|moi thang)/.test(plain)) return clarification('Hãy tạo lịch tại Giao dịch → Định kỳ để chọn ngày, tài khoản và số tiền. Câu này chưa được ghi thành giao dịch.');
  if (/(khong|chua|dung)\s+(ghi|them|chi|chuyen|tao)/.test(plain)) return clarification('Chưa ghi giao dịch. Hãy nêu lại giao dịch bạn muốn thực hiện.');
  if (/[;\n]/.test(text) || /\s(?:va|rồi|roi)\s/.test(plain)) return clarification('Hãy gửi từng giao dịch riêng để xác nhận đúng số tiền và tài khoản.');
  const aliases: Record<string,string[]> = {'techcombank':['tcb','techcom'], 'vietcombank':['vcb','vietcom'], 'tien mat':['cash'], 'mb bank':['mbbank','mb']};
  const matches = (segment: string, name: string) => {
    const n=normalize(name), value=normalize(segment);
    const candidates=[n, ...(aliases[n] || [])];
    return candidates.some(alias => (' '+value.replace(/[^a-z0-9]+/g,' ')+' ').includes(' '+alias.replace(/[^a-z0-9]+/g,' ')+' '));
  };
  const mentioned=accountNames.filter(name=>matches(text,name));
  const sourceText=plain.match(/(?:tu)\s+(.+?)(?:\s+(?:sang|vao|den|qua)\s+)/)?.[1];
  const targetText=plain.match(/(?:sang|vao|den|qua)\s+(.+)/)?.[1];
  const transfer=/\bchuyen\b/.test(plain) && !!targetText;
  const sources=sourceText?accountNames.filter(n=>matches(sourceText,n)):mentioned;
  const targets=targetText?accountNames.filter(n=>matches(targetText,n)):[];
  const source=transfer?(sourceText?sources.length===1?sources[0]:undefined:mentioned.filter(n=>!targets.includes(n)).length===1?mentioned.filter(n=>!targets.includes(n))[0]:undefined):mentioned.length===1?mentioned[0]:accountNames.length===1?accountNames[0]:undefined;
  if (!source || (transfer && (targets.length!==1 || targets[0]===source))) return clarification('Vui lòng chỉ rõ tài khoản nguồn và tài khoản đích khác nhau (nếu chuyển tiền), dùng tên tài khoản trong app.');
  // Convert common unaccented financial words before intent/category recognition.
  for(const [a,b] of [['chuyen','chuyển'],['nhan','nhận'],['luong','lương'],['thuong','thưởng'],['thu nhap','thu nhập'],['tra no','trả nợ'],['tien mat','tiền mặt'],['trieu','triệu'],['nghin','nghìn'],['ngan','ngàn'],['an trua','ăn trưa'],['ca phe','cà phê']]) lower=lower.replace(new RegExp('\\b'+a+'\\b','g'),b);
  // Dates cannot be interpreted as monetary amounts.
  const originalLower = lower;
  lower=lower.replace(/\b\d{4}-\d{2}-\d{2}\b/g,'').replace(/\b\d{1,2}[/]\d{1,2}(?:[/]\d{4})?\b/g,'');

  // Parse one explicit monetary expression. Never select the largest of multiple amounts.
  lower=lower.replace(/(\d+)\s*(?:tr|triệu)(\d)(?!\d)/g, '$1,$2 triệu');
  const expressions = [...lower.matchAll(/(?<![\w.,-])(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(triệu|trieu|trđ|tr|củ|cu|nghìn|nghin|ngàn|ngan|k|vnd|vnđ|đồng|đ)?/gu)];
  if(expressions.length!==1) return clarification('Vui lòng nêu một số tiền chính xác cho mỗi giao dịch.');
  const [,number,unit] = expressions[0];
  const multiplier=/^(triệu|trieu|trđ|tr|củ|cu)$/.test(unit||'')?1000000:/^(nghìn|nghin|ngàn|ngan|k)$/.test(unit||'')?1000:1;
  const grouped=/^\d{1,3}(?:[.,]\d{3})+$/.test(number);
  const amount=Math.round(Number(grouped?number.replace(/[.,]/g,''):number.replace(',','.'))*multiplier);
  if(!Number.isSafeInteger(amount)||amount<=0||(!unit&&amount<1000)) return clarification('Vui lòng ghi rõ số tiền và đơn vị đồng, nghìn hoặc triệu.');

  const matchedAccount = source;
  // Detect Intent
  let intent = 'create_expense';
  let kind: 'expense' | 'income' | 'transfer' | 'lend' | 'debt_repay' = 'expense';
  let accountTo: string | null = null;
  let person: string | null = null;

  if (transfer) {
    intent = 'create_transfer';
    kind = 'transfer';
    accountTo = targets[0];
  } else if (lower.includes('cho') && (lower.includes('vay') || lower.includes('mượn'))) {
    intent = 'lend';
    kind = 'lend';
    const personMatch = lower.match(/cho\s+([a-zA-Zà-ỹÀ-Ỹ\s]+?)\s+(?:vay|mượn)/i);
    person = personMatch ? personMatch[1].trim() : 'Bạn bè';
  } else if (
    !lower.includes('trả nợ') && !lower.includes('thanh toán nợ') && (lower.includes('nhận') ||
    lower.includes('lương') ||
    lower.includes('thưởng') ||
    lower.includes('thu nhập') ||
    lower.includes('được cho'))
  ) {
    intent = 'create_income';
    kind = 'income';
  } else if (lower.includes('trả nợ') || lower.includes('thanh toán nợ')) {
    intent = 'debt_repay';
    kind = 'debt_repay';
  } else if (lower.includes('số dư') || lower.includes('còn bao nhiêu') || lower.includes('tổng tiền')) {
    return {
      intent: 'query_balance',
      needs_confirmation: false,
      clarification_question: null,
      clarification_options: [],
      analysis: 'Người dùng đang hỏi về số dư hiện tại của các tài khoản.',
      answer: 'Dưới đây là thông tin số dư theo sổ cái LTMsav của bạn.',
      commands: [],
    };
  }

  // Detect Category (improved)
  let matchedCategory = kind === 'income' ? 'Lương' : 'Ăn uống';
  const categoryKeywords: Record<string, string[]> = {
    'Ăn uống': ['ăn', 'uống', 'bữa', 'trưa', 'sáng', 'tối', 'cà phê', 'cafe', 'cf', 'trà sữa', 'trà', 'cơm', 'phở', 'bún', 'nhậu', 'buffet', 'bánh', 'snack', 'ăn vặt'],
    'Di chuyển': ['xăng', 'grab', 'gojek', 'be', 'taxi', 'xe', 'gửi xe', 'vé xe', 'vé', 'bảo dưỡng', 'sửa xe', 'đổ xăng'],
    'Mua sắm': ['mua', 'quần', 'áo', 'giày', 'dép', 'shopee', 'lazada', 'tiki', 'sendo', 'đồ gia dụng', 'siêu thị', 'chợ'],
    'Hóa đơn & Tiện ích': ['điện', 'nước', 'internet', 'wifi', 'rác', 'tiền mạng', 'cước', 'gas', 'điện thoại'],
    'Giải trí': ['phim', 'game', 'du lịch', 'netflix', 'spotify', 'hát', 'karaoke', 'bar', 'pub'],
    'Nhà cửa': ['thuê nhà', 'tiền nhà', 'sửa chữa', 'nội thất'],
    'Sức khỏe': ['thuốc', 'khám', 'bệnh viện', 'phòng khám'],
    'Lương': ['lương', 'salary', 'lương tháng'],
    'Thưởng': ['thưởng', 'bonus'],
    'Thu nhập khác': ['bán đồ', 'tiền lãi', 'cho thuê', 'thu nhập'],
  };

  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(k => (' '+normalize(lower).replace(/[^a-z0-9]+/g,' ')+' ').includes(' '+normalize(k)+' '))) {
      matchedCategory = cat;
      break;
    }
  }
  // if income but still defaulted oddly, try to be smarter
  if (kind === 'income' && matchedCategory === 'Ăn uống') {
    matchedCategory = 'Thu nhập khác';
  }

  // Clean description
  let description = text.replace(/^(hôm nay|vừa|đã|mới)\s+/i, '');
  if (description.length > 50) description = description.substring(0, 50);

  let today = localDate(referenceDate);
  const relative = /hom kia/.test(plain)?-2:/hom qua/.test(plain)?-1:/ngay mai/.test(plain)?1:0;
  if(relative) today=localDate(new Date(referenceDate.getFullYear(),referenceDate.getMonth(),referenceDate.getDate()+relative));
  const explicit = originalLower.match(/\b(\d{4})-(\d{2})-(\d{2})\b/) || originalLower.match(/\b(\d{1,2})[/](\d{1,2})(?:[/](\d{4}))?\b/);
  if(explicit){
    const iso=explicit[1].length===4;
    const y=iso?+explicit[1]:+(explicit[3]||referenceDate.getFullYear()), m=+explicit[2], d=iso?+explicit[3]:+explicit[1];
    const date=new Date(y,m-1,d);
    if(date.getFullYear()!==y || date.getMonth()!==m-1 || date.getDate()!==d) return clarification('Ngày giao dịch không hợp lệ.');
    today=localDate(date);
  }
  const categoryMatches=categoryNames.filter(name=>normalize(text).includes(normalize(name)));
  if(categoryMatches.length===1) matchedCategory=categoryMatches[0];
  if(!categoryNames.includes(matchedCategory) && kind!=='transfer') return clarification('Vui lòng chỉ rõ danh mục có trong app.');

  return {
    intent,
    needs_confirmation: true,
    clarification_question: amount === 0 ? 'Vui lòng cho biết số tiền giao dịch chính xác.' : kind === 'transfer' && !accountTo ? 'Vui lòng chỉ rõ tài khoản đích có trong danh sách tài khoản của bạn.' : null,
    clarification_options: [],
    analysis: `Đã phân tích giao dịch: ${kind.toUpperCase()} ${amount.toLocaleString('vi-VN')}₫ vào danh mục [${matchedCategory}] qua [${matchedAccount}].`,
    answer: null,
    commands: amount > 0 && (kind !== 'transfer' || !!accountTo) ? [
      {
        kind,
        amount,
        currency: 'VND',
        account: matchedAccount,
        account_to: accountTo,
        category: matchedCategory,
        date: today,
        description: description || 'Giao dịch mới',
        person,
        note: `Tạo qua AI: "${text}"`,
      },
    ] : [],
  };
}

export async function processAiMessage(
  message: string,
  accounts: Account[],
  categories: Category[],
  settings?: AppSettings,
  context?: {transactions: Transaction[]; recurring: RecurringTransaction[]; budgets: Budget[]}
): Promise<AiChatResponse> {
  const plain=message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
  const reply=(answer:string): AiChatResponse=>({intent:'query_report',needs_confirmation:false,analysis:'Tính từ dữ liệu trên thiết bị, không gửi sổ giao dịch ra dịch vụ AI.',answer,commands:[]});
  const money=(n:number)=>n.toLocaleString('vi-VN')+'₫';
  if(/(so du|con bao nhieu|tong tien)/.test(plain)) return reply(accounts.map(a=>a.name+': '+money(a.balance)).join('\n')+'\nTổng: '+money(accounts.reduce((s,a)=>s+a.balance,0)));
  if(context && (/(du bao|du doan)/.test(plain) || (/(thang toi|quy toi|nam toi|thang sau|quy sau|nam sau)/.test(plain) && /(bao nhieu|chi tieu|uoc tinh)/.test(plain)))) {
    const period=/quy/.test(plain)?'quarter':/nam/.test(plain)?'year':'month';
    const f=forecastSpending(context.transactions,context.recurring,period);
    return reply(`Dự báo ${f.projections[0].month} → ${f.projections.at(-1)!.month}: ${money(f.total)}. Trong đó lịch định kỳ: ${money(f.scheduled)}.\n${f.supported?`Trung bình ${f.months.length} tháng lịch sử; khoảng kịch bản ${money(f.low)}–${money(f.high)} (không phải khoảng tin cậy thống kê).`:'Chưa đủ 2 tháng lịch sử: chỉ tính lịch định kỳ, chưa ước tính chi khác.'} Giả định ghi sổ đầy đủ và lịch không đổi.`);
  }
  if(context && /(bao cao|phan tich|da chi.*bao nhieu|chi tieu.*bao nhieu|ngan sach)/.test(plain)) {
    if(/(thang truoc|quy|nam|hom qua)/.test(plain)) return reply('Báo cáo chat hiện hỗ trợ tháng hiện tại. Mở Báo cáo để chọn khoảng thời gian khác.');
    const month=localDate().slice(0,7);
    const txs=context.transactions.filter(tx=>tx.date.startsWith(month)&&tx.date<=localDate());
    const spent=txs.filter(tx=>tx.type==='expense').reduce((s,tx)=>s+tx.amount,0);
    const income=txs.filter(tx=>tx.type==='income').reduce((s,tx)=>s+tx.amount,0);
    return reply(`Sổ giao dịch tháng ${month}: thu ${money(income)}, chi ${money(spent)}, chênh lệch ${money(income-spent)}.\n`+context.budgets.map(b=>{const actual=txs.filter(tx=>tx.type==='expense'&&tx.categoryId===b.categoryId).reduce((s,tx)=>s+tx.amount,0);return `${categories.find(c=>c.id===b.categoryId)?.name||b.categoryId}: ${money(actual)} / ${money(b.monthlyLimit)}${actual>b.monthlyLimit?' — vượt ngân sách':''}`;}).join('\n'));
  }
  const accountNames = accounts.map(a => a.name);
  const categoryNames = categories.map(c => c.name);

  if(/(hang thang|dinh ky|moi thang|(?:khong|chua|dung)\s+(?:ghi|them|chi|chuyen|tao))/.test(plain)) return parseVietnameseFinancialCommand(message,accountNames,categoryNames);

  const hasGeminiKey = !!(settings?.geminiApiKey && settings.geminiApiKey.trim());
  const hasCustomServer = !!(settings?.customServerUrl && settings.customServerUrl.trim());

  // 1. If Gemini API key is provided directly in app settings, try Gemini FIRST
  if (hasGeminiKey) {
    try {
      const apiKey = settings!.geminiApiKey!.trim();
      const today = localDate();
      const systemInstruction = `Bạn là trợ lý phân tích giao dịch tài chính thông minh cho ứng dụng LTMsav (tiếng Việt).

NHIỆM VỤ:
- Hiểu hoàn toàn ngôn ngữ tự nhiên, nói ngắn, nói gộp, không theo khuôn mẫu cố định. Hãy suy luận theo ngữ cảnh thay vì dò từ khóa.
- Chuyển câu người dùng thành lệnh giao dịch có cấu trúc JSON để hiển thị xác nhận rồi ghi sổ.

DANH SÁCH BẮT BUỘC CHỈ ĐƯỢC SỬ DỤNG:
- Tài khoản khả dụng: ${accountNames.length ? accountNames.join(' | ') : 'Tiền mặt | Vietcombank | Ví MoMo | Tiết kiệm'}
- Danh mục khả dụng: ${categoryNames.length ? categoryNames.join(' | ') : 'Ăn uống | Di chuyển | Mua sắm | Hóa đơn & Tiện ích | Nhà cửa | Giải trí | Sức khỏe | Lương | Thưởng | Thu nhập khác'}

NGUYÊN TẮC BẮT BUỘC:
1. CHỈ trả về JSON hợp lệ thuần túy, KHÔNG markdown, KHÔNG giải thích, KHÔNG text ngoài JSON.
2. Chỉ dùng đúng tên tài khoản/danh mục có trong danh sách trên. Nếu người dùng nói tên gần giống hoặc ngụ ý, hãy chọn mục PHÙ HỢP NHẤT theo ngữ nghĩa từ danh sách. TUYỆT ĐỐI KHÔNG tự tạo tài khoản/danh mục mới.
3. Quy đổi số tiền về VND số nguyên. Hiểu mọi cách viết: "45k", "50000", "2 triệu", "1,5 triệu", "2tr", "500 nghìn", "1 củ", ...
4. Nếu là chuyển khoản giữa các tài khoản (chuyển từ A sang B) -> intent "create_transfer", kind "transfer", bắt buộc có "account_to" là tài khoản đích (khác tài khoản nguồn).
5. Cho vay/mượn -> "lend", hoàn trả nợ -> "debt_repay". Có thể điền "person" nếu có tên người.
6. Ngày dùng định dạng yyyy-MM-dd. Nếu không nói ngày cụ thể -> dùng "${today}".
7. "description" ngắn gọn, tự nhiên theo nội dung thực tế.
8. Ưu tiên tạo "commands" khi đã xác định được ít nhất: loại giao dịch + số tiền + tài khoản. Đặt "needs_confirmation": true để người dùng xác nhận trước khi ghi sổ.
9. Khi thiếu số tiền hoặc không xác định duy nhất tài khoản, hỏi lại và trả commands rỗng; không tự chọn tài khoản đầu danh sách. Không tạo giao dịch từ câu hỏi, phủ định hoặc yêu cầu định kỳ. Không tự bịa số dư, báo cáo hay dự báo khi không được cung cấp dữ liệu.
10. Luôn trả về đầy đủ schema sau.

SCHEMA JSON:
{
  "intent": "create_expense" | "create_income" | "create_transfer" | "lend" | "debt_repay" | "query_balance" | "query_report",
  "needs_confirmation": boolean,
  "clarification_question": string | null,
  "clarification_options": string[],
  "analysis": "giải thích ngắn gọn lý do phân tích",
  "answer": string | null,
  "commands": [
    {
      "kind": "expense" | "income" | "transfer" | "lend" | "debt_repay",
      "amount": number,
      "currency": "VND",
      "account": string,
      "account_to": string | null,
      "category": string,
      "date": "yyyy-MM-dd",
      "description": string,
      "note": string | null,
      "person": string | null
    }
  ]
}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\nCâu lệnh người dùng: ${message}` }],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0,
              topP: 1,
              topK: 1,
            },
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textOutput) {
          try {
            const parsed = JSON.parse(textOutput);
            return validateAiResponse(parsed, accounts, categories);
          } catch (parseErr) {
            console.warn('Gemini JSON parse failed:', parseErr);
          }
        }
      } else {
        console.warn('Gemini API error:', res.status);
      }
    } catch (apiErr) {
      console.warn('Gemini direct API call failed, will try fallback:', apiErr);
    }
  }

  // 2. If user configured custom backend server URL, try it
  if (hasCustomServer) {
    try {
      const endpoint = settings!.customServerUrl!.replace(/\/+$/, '') + '/api/chat';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, accounts: accountNames, categories: categoryNames }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        return validateAiResponse(await res.json(), accounts, categories);
      }
    } catch (e) {
      console.warn('Custom backend failed, trying other methods:', e);
    }
  }

  // 3. Try relative /api/chat (works when running locally with server.ts)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, accounts: accountNames, categories: categoryNames }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      return validateAiResponse(await res.json(), accounts, categories);
    }
  } catch (e) {
    // Relative endpoint unreachable (e.g. mobile standalone APK)
  }
  // 4. Default: Reliable offline rule-based Vietnamese NLP parser
  return parseVietnameseFinancialCommand(message, accountNames, categoryNames);
}

/** Model output is untrusted; storage remains the final authority. */
export function validateAiResponse(value: unknown, accounts: Account[], categories: Category[]): AiChatResponse {
  const r=value as AiChatResponse;
  if(!r || typeof r.analysis!=='string' || !Array.isArray(r.commands)) throw new Error('Invalid AI response');
  for(const c of r.commands){
    if(!['expense','income','transfer','lend','debt_repay'].includes(c.kind) || !Number.isSafeInteger(c.amount) || c.amount<=0 || c.currency!=='VND' || !accounts.some(a=>a.name===c.account) || !/^\d{4}-\d{2}-\d{2}$/.test(c.date) || !Number.isFinite(Date.parse(c.date)) || localDate(new Date(c.date+'T12:00:00'))!==c.date || typeof c.description!=='string') throw new Error('Invalid AI command');
    if(c.kind==='transfer' ? !accounts.some(a=>a.name===c.account_to&&a.name!==c.account) : !categories.some(cat=>cat.name===c.category && cat.type===(c.kind==='income'?'income':'expense'))) throw new Error('Invalid AI reference');
  }
  return {...r,needs_confirmation:r.commands.length>0};
}
