import { Account, Category, AiChatResponse, AppSettings } from '../types';

export function parseVietnameseFinancialCommand(
  text: string,
  accountNames: string[],
  categoryNames: string[]
): AiChatResponse {
  const lower = text.toLowerCase().trim();

  // Extract amount
  let amount = 0;
  const millionMatch = lower.match(/(\d+(?:[\.,]\d+)?)\s*(?:triệu|trieu|tr|củ|cu)\b/);
  const thousandMatch = lower.match(/(\d+(?:[\.,]\d+)?)\s*(?:k|nghìn|nghin|ngàn|ngan)\b/);
  const rawNumberMatch = lower.match(/(?:(?:hết|nhận|chuyển|vay|trả|tiêu)\s+)?(\d{1,3}(?:\.\d{3})+|\d+)\s*(?:đ|vnd|đồng)?\b/);

  if (millionMatch) {
    amount = Math.round(parseFloat(millionMatch[1].replace(',', '.')) * 1000000);
  } else if (thousandMatch) {
    amount = Math.round(parseFloat(thousandMatch[1].replace(',', '.')) * 1000);
  } else if (rawNumberMatch) {
    const cleanNum = rawNumberMatch[1].replace(/\./g, '').replace(/,/g, '');
    const val = parseInt(cleanNum, 10);
    if (!isNaN(val) && val > 0) {
      amount = val;
    }
  }

  // Detect Account
  let matchedAccount = accountNames[0] || 'Tiền mặt';
  for (const acc of accountNames) {
    const accLow = acc.toLowerCase();
    if (
      lower.includes(accLow) ||
      (accLow.includes('vietcombank') && (lower.includes('vcb') || lower.includes('vietcom'))) ||
      (accLow.includes('momo') && lower.includes('momo')) ||
      (accLow.includes('tiền mặt') && (lower.includes('tiền mặt') || lower.includes('tien mat')))
    ) {
      matchedAccount = acc;
      break;
    }
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
      accountTo = accountNames.find(a => a !== matchedAccount) || accountNames[1] || 'Vietcombank';
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

  // Detect Category
  let matchedCategory = kind === 'income' ? 'Lương' : 'Ăn uống';
  const categoryKeywords: Record<string, string[]> = {
    'Ăn uống': ['ăn', 'uống', 'trưa', 'sáng', 'tối', 'cà phê', 'cafe', 'cf', 'trà sữa', 'nhậu', 'buffet', 'bánh'],
    'Di chuyển': ['xăng', 'grab', 'xe', 'taxi', 'be', 'gửi xe', 'vé', 'bảo dưỡng', 'sửa xe'],
    'Mua sắm': ['mua', 'quần', 'áo', 'giày', 'shopee', 'lazada', 'tiki', 'đồ gia dụng', 'siêu thị'],
    'Hóa đơn & Tiện ích': ['điện', 'nước', 'internet', 'wifi', 'rác', 'tiền mạng', 'cước'],
    'Giải trí': ['phim', 'game', 'du lịch', 'netflix', 'spotify', 'hát', 'karaoke'],
    'Lương': ['lương', 'salary'],
    'Thưởng': ['thưởng', 'bonus'],
    'Thu nhập khác': ['bán đồ', 'tiền lãi', 'thu nhập'],
  };

  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(k => lower.includes(k))) {
      matchedCategory = cat;
      break;
    }
  }

  // Clean description
  let description = text.replace(/^(hôm nay|vừa|đã|mới)\s+/i, '');
  if (description.length > 50) description = description.substring(0, 50);

  const today = new Date().toISOString().split('T')[0];

  return {
    intent,
    needs_confirmation: true,
    clarification_question: amount === 0 ? 'Vui lòng xác nhận lại số tiền giao dịch chính xác.' : null,
    clarification_options: [],
    analysis: `Đã phân tích giao dịch: ${kind.toUpperCase()} ${amount.toLocaleString('vi-VN')}₫ vào danh mục [${matchedCategory}] qua [${matchedAccount}].`,
    answer: null,
    commands: [
      {
        kind,
        amount: amount || 50000,
        currency: 'VND',
        account: matchedAccount,
        account_to: accountTo,
        category: matchedCategory,
        date: today,
        description: description || 'Giao dịch mới',
        person,
        note: `Tạo qua AI: "${text}"`,
      },
    ],
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

  // 1. If user configured custom backend server URL, try it first
  if (settings?.customServerUrl) {
    try {
      const endpoint = settings.customServerUrl.replace(/\/+$/, '') + '/api/chat';
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

  // 2. Try relative /api/chat (works when running locally with server.ts)
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

  // 3. If Gemini API key is provided directly in app settings, call Gemini REST API
  if (settings?.geminiApiKey) {
    try {
      const apiKey = settings.geminiApiKey.trim();
      const systemInstruction = `Bạn là bộ phân tích câu lệnh tài chính cho ứng dụng LTMsav (tiếng Việt).
Nhiệm vụ: chuyển câu nói tự nhiên của người dùng thành JSON có cấu trúc.
NGUYÊN TẮC BẮT BUỘC:
1. CHỈ trả về JSON hợp lệ thuần túy, không kèm Markdown hay text ngoài JSON.
2. Nguồn tiền khả dụng: ${accountNames.join(', ') || 'Tiền mặt, Vietcombank, Ví MoMo, Tiết kiệm'}.
3. Danh mục khả dụng: ${categoryNames.join(', ') || 'Ăn uống, Di chuyển, Mua sắm, Hóa đơn & Tiện ích, Nhà cửa, Giải trí, Lương, Thưởng'}.
4. Số tiền: quy đổi về đồng (VND), kiểu số nguyên. "45k"=45000, "2 triệu"=2000000.
5. Ngày: định dạng yyyy-MM-dd.
6. Schema JSON:
{
  "intent": "create_expense" | "create_income" | "create_transfer" | "lend" | "debt_repay" | "query_balance" | "query_report",
  "needs_confirmation": boolean,
  "clarification_question": string | null,
  "clarification_options": string[],
  "analysis": "giải thích ngắn gọn",
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

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\nCâu lệnh: ${message}` }],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textOutput) {
          const parsed = JSON.parse(textOutput);
          return parsed;
        }
      }
    } catch (apiErr) {
      console.warn('Gemini direct API call failed, falling back to local rule-based parser:', apiErr);
    }
  }

  // 4. Default: Reliable offline rule-based Vietnamese NLP parser
  return parseVietnameseFinancialCommand(message, accountNames, categoryNames);
}
