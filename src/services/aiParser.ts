import { localDate } from './date';
import { Account, Category, AiChatResponse, AppSettings } from '../types';

export function parseVietnameseFinancialCommand(
  text: string,
  accountNames: string[],
  categoryNames: string[]
): AiChatResponse {
  const lower = text.toLowerCase().trim();

  // Extract amount (more flexible)
  let amount = 0;
  // million/trieu
  const millionMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|trieu|trieuđ|trđ|củ|cu)\b/);
  const trMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*tr\b/);
  // thousand/nghin
  const thousandMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:nghìn|nghin|ngàn|ngan|k\b)/);
  // grouped numbers like 1.000.000, 1,000,000
  const groupedMatch = lower.match(/(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?)/);
  // standalone 4-9 digit numbers
  const rawNumberMatch = lower.match(/(\d{4,9})\b/);

  if (millionMatch) {
    amount = Math.round(parseFloat(millionMatch[1].replace(',', '.')) * 1000000);
  } else if (trMatch) {
    amount = Math.round(parseFloat(trMatch[1].replace(',', '.')) * 1000000);
  } else if (thousandMatch) {
    amount = Math.round(parseFloat(thousandMatch[1].replace(',', '.')) * 1000);
  } else if (groupedMatch) {
    const s = groupedMatch[1];
    const parts = s.split(/[.,]/);
    if (parts.length > 2 && parts[parts.length - 1].length === 3) {
      const clean = s.replace(/\./g, '').replace(/,/g, '');
      amount = parseInt(clean, 10);
    } else if (parts.length === 2 && parts[1].length <= 2) {
      amount = Math.round(parseFloat(s.replace(',', '.')));
    } else {
      const clean = s.replace(/\./g, '').replace(/,/g, '');
      amount = parseInt(clean, 10);
    }
  } else if (rawNumberMatch) {
    amount = parseInt(rawNumberMatch[1], 10);
  }
  // also try to find any number before currency words
  if (amount === 0) {
    const anyNum = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:đ|vnd|đồng|vnđ)\b/);
    if (anyNum) {
      const s = anyNum[1];
      const parts = s.split(/[.,]/);
      if (parts.length === 2 && parts[1].length <= 2) {
        amount = Math.round(parseFloat(s.replace(',', '.')));
      } else {
        const clean = s.replace(/\./g, '').replace(/,/g, '');
        amount = parseInt(clean, 10);
      }
    }
  }
  // last resort: any number >=1000 that's not too small
  if (amount === 0 || amount < 1000) {
    const allNums = lower.match(/(\d{1,3}(?:[.,]\d{3})+|\d{4,9})/g);
    if (allNums && allNums.length) {
      for (const n of allNums) {
        // skip if part of "tr" or "triệu"
        const idx = lower.indexOf(n);
        if (idx >= 0) {
          const after = lower.slice(idx + n.length, idx + n.length + 5);
          if (/\btr\b|triệu|trieu/.test(after) || after.trim().startsWith('tr')) continue;
        }
        const parts = n.split(/[.,]/);
        let val = 0;
        if (parts.length > 2 && parts[parts.length - 1].length === 3) {
          val = parseInt(n.replace(/\./g, '').replace(/,/g, ''), 10);
        } else if (parts.length === 2 && parts[1].length <= 2) {
          val = Math.round(parseFloat(n.replace(',', '.')));
        } else {
          val = parseInt(n.replace(/\./g, '').replace(/,/g, ''), 10);
        }
        if (val > amount && val >= 1000) amount = val;
      }
    }
  }
  // if still small but user said tr/million context
  if (amount > 0 && amount < 10000 && (lower.includes('triệu') || lower.includes('trieu') || lower.includes('tr\b'))) {
    // already handled above, but just in case
  }

  // Detect Account
  let matchedAccount = accountNames[0] || 'Tiền mặt';
  for (const acc of accountNames) {
    const accLow = acc.toLowerCase();
    if (
      lower.includes(accLow) ||
      lower.includes(accLow.replace(/\s+/g, '')) ||
      (accLow.includes('vietcombank') && (lower.includes('vcb') || lower.includes('vietcom'))) ||
      (accLow.includes('momo') && lower.includes('momo')) ||
      (accLow.includes('zalopay') && lower.includes('zalopay')) ||
      (accLow.includes('vnpay') && lower.includes('vnpay')) ||
      (accLow.includes('tiền mặt') && (lower.includes('tiền mặt') || lower.includes('tien mat') || lower.includes('cash')))
    ) {
      matchedAccount = acc;
      break;
    }
  }

  // In explicit "from A to B" commands, list ordering must not reverse the transfer.
  const sourceSegment = lower.match(/(?:từ|tu)\s+(.+?)(?:\s+(?:sang|vào|đến|qua)\s+)/)?.[1];
  if (sourceSegment) {
    const explicitSource = accountNames.find(name => sourceSegment.includes(name.toLowerCase()));
    if (explicitSource) matchedAccount = explicitSource;
  }

  // Detect Intent
  let intent = 'create_expense';
  let kind: 'expense' | 'income' | 'transfer' | 'lend' | 'debt_repay' = 'expense';
  let accountTo: string | null = null;
  let person: string | null = null;

  if (lower.includes('chuyển') && (lower.includes('sang') || lower.includes('vào') || lower.includes('đến'))) {
    intent = 'create_transfer';
    kind = 'transfer';
    for (const acc of accountNames) {
      if (acc !== matchedAccount && lower.includes(acc.toLowerCase())) {
        accountTo = acc;
        break;
      }
    }
    if (!accountTo) {
      accountTo = null;
    }
  } else if (lower.includes('cho') && (lower.includes('vay') || lower.includes('mượn'))) {
    intent = 'lend';
    kind = 'lend';
    const personMatch = lower.match(/cho\s+([a-zA-Zà-ỹÀ-Ỹ\s]+?)\s+(?:vay|mượn)/i);
    person = personMatch ? personMatch[1].trim() : 'Bạn bè';
  } else if (
    lower.includes('nhận') ||
    lower.includes('lương') ||
    lower.includes('thưởng') ||
    lower.includes('thu nhập') ||
    lower.includes('được cho')
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
    if (keywords.some(k => lower.includes(k))) {
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

  const today = localDate();

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
  settings?: AppSettings
): Promise<AiChatResponse> {
  const accountNames = accounts.map(a => a.name);
  const categoryNames = categories.map(c => c.name);

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
9. Chỉ đặt "clarification_question" khi THỰC SỰ thiếu thông tin quan trọng không thể suy luận (thường chỉ khi thiếu số tiền). Nếu số tiền đã rõ, đừng hỏi vòng vo.
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
            return parsed;
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
        return await res.json();
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
      return await res.json();
    }
  } catch (e) {
    // Relative endpoint unreachable (e.g. mobile standalone APK)
  }
  // 4. Default: Reliable offline rule-based Vietnamese NLP parser
  return parseVietnameseFinancialCommand(message, accountNames, categoryNames);
}
