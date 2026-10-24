import { localDate } from './src/services/date';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.use(express.json());

import { parseVietnameseFinancialCommand } from './src/services/aiParser';

// AI Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, accounts = [], categories = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Nội dung tin nhắn không hợp lệ' });
  }

  if (message.length > 4000 || !Array.isArray(accounts) || !Array.isArray(categories) || accounts.length > 200 || categories.length > 200 || [...accounts, ...categories].some(value => typeof value !== 'string' || value.length > 200)) return res.status(400).json({ error: 'Dữ liệu đầu vào không hợp lệ hoặc quá dài.' });

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const today = localDate();
      const systemInstruction = `Bạn là trợ lý phân tích giao dịch tài chính thông minh cho ứng dụng LTMsav (tiếng Việt).

NHIỆM VỤ:
- Hiểu hoàn toàn ngôn ngữ tự nhiên, nói ngắn, nói gộp, không theo khuôn mẫu cố định. Hãy suy luận theo ngữ cảnh thay vì dò từ khóa.
- Chuyển câu người dùng thành lệnh giao dịch có cấu trúc JSON để hiển thị xác nhận rồi ghi sổ.

DANH SÁCH BẮT BUỘC CHỈ ĐƯỢC SỬ DỤNG:
- Tài khoản khả dụng: ${accounts.length ? accounts.join(' | ') : 'Tiền mặt | Vietcombank | Ví MoMo | Tiết kiệm'}
- Danh mục khả dụng: ${categories.length ? categories.join(' | ') : 'Ăn uống | Di chuyển | Mua sắm | Hóa đơn & Tiện ích | Nhà cửa | Giải trí | Sức khỏe | Lương | Thưởng | Thu nhập khác'}

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

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: systemInstruction + '\n\nCâu lệnh người dùng: ' + message }] }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        }
      });

      const textOutput = response.text?.trim() || '';
      try {
        const parsed = JSON.parse(textOutput);
        return res.json(parsed);
      } catch (err) {
        console.warn('Gemini JSON parse failed, falling back to rule-based parser:', err);
      }
    } catch (apiErr) {
      console.warn('Gemini API request failed, falling back to rule-based parser:', apiErr);
    }
  }

  // Fallback to internal rule-based parser
  const parsedResult = parseVietnameseFinancialCommand(message, accounts, categories);
  return res.json(parsedResult);
});

import http from 'http';

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  const httpServer = http.createServer(app);

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: HOST,
        port: PORT,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, HOST, () => {
    console.log(`[LTMsav] Server running at http://${HOST}:${PORT}`);
  });
}

startServer();
