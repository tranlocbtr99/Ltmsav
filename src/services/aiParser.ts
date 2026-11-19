import type { Account, Category, AiChatResponse, AppSettings, DebtOrLoan, Budget, Transaction } from '../types';
import { aiPrompt, localDay, normalizeAiResponse, parseVietnameseFinancialCommand, nonPostingReason, isAiQuery, buildFinancialContextSummary } from './aiFinancial';
export { parseVietnameseFinancialCommand } from './aiFinancial';

export const getEmbeddedGeminiKey = (): string => {
  try {
    return atob('QVEuQWI4Uk42SjhvOW10TzVJWkpwSnIwNEVmbGRuQjh1aUdYYmhsZ0VqVHZCcEd3RGprcnc=');
  } catch {
    return '';
  }
};

const GEMINI_MODEL = 'gemini-flash-lite-latest';

async function requestJson(url: string, body: unknown, timeout: number): Promise<unknown> {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(body), 
      signal: controller.signal 
    });
    if (!response.ok)
      throw new Error(`AI service status ${response.status}`);
    const text = await response.text();
    if (text.length > 200000)
      throw new Error('AI response too large');
    return JSON.parse(text);
  }
  finally {
    clearTimeout(timer);
  }
}

export async function processAiMessage(
  message: string, 
  accounts: Account[], 
  categories: Category[], 
  settings?: AppSettings,
  additionalContext?: {
    debts?: DebtOrLoan[];
    budgets?: Budget[];
    transactions?: Transaction[];
  }
): Promise<AiChatResponse> {
  if (!message.trim() || message.length > 4000)
    throw new Error('Nội dung phải từ 1 đến 4.000 ký tự.');
  
  const names = accounts.map(a => a.name);
  const cats = categories.map(c => c.name);
  const today = localDay();
  const normalize = (raw: unknown) => normalizeAiResponse(raw, message, accounts, categories);

  // If no API key configured and it is a non-posting prompt or query, rely on local deterministic parser
  if (!settings?.geminiApiKey && (nonPostingReason(message) || isAiQuery(message))) {
    return parseVietnameseFinancialCommand(message, names, cats);
  }

  const key = settings?.geminiApiKey?.trim() || getEmbeddedGeminiKey();

  if (key) {
    const financialSummary = buildFinancialContextSummary(
      accounts,
      categories,
      additionalContext?.debts,
      additionalContext?.budgets,
      additionalContext?.transactions
    );

    const promptText = aiPrompt(accounts, categories, today, financialSummary);

    // Single unified Gemini call
    try {
      const raw = await requestJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`,
        {
          systemInstruction: { parts: [{ text: promptText }] },
          contents: [{ role: 'user', parts: [{ text: message }] }],
          generationConfig: {
            temperature: 0.2,
          }
        },
        12000
      ) as any;

      const text = raw?.candidates?.[0]?.content?.parts?.map((part: any) => typeof part.text === 'string' ? part.text : '').join('');
      if (text) {
        // Clean potential markdown code fences ```json ... ```
        const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        
        try {
          const parsed = JSON.parse(cleaned);
          if (parsed && typeof parsed === 'object') {
            // Case 1: Financial Advisory Question answered
            if (parsed.answer || parsed.intent === 'financial_advisory') {
              return {
                intent: 'financial_advisory',
                needs_confirmation: false,
                analysis: typeof parsed.analysis === 'string' ? parsed.analysis : 'Tư vấn tài chính thông minh',
                answer: parsed.answer || parsed.analysis || text,
                commands: [],
              };
            }
            // Case 2: Transaction Draft command
            return normalize(parsed);
          }
        } catch {
          // If response is direct markdown advice without JSON wrapping
          if (text.length > 20) {
            return {
              intent: 'financial_advisory',
              needs_confirmation: false,
              analysis: 'Tư vấn tài chính',
              answer: text,
              commands: [],
            };
          }
        }
      }
    } catch {
      // Fall through to server / fallback
    }
  }

  // Fallback to custom server if specified
  const body = { 
    message, 
    accounts: names, 
    categories: cats, 
    categoryDetails: categories.map(c => ({ name: c.name, type: c.type })), 
    localDate: today 
  };
  
  const custom = settings?.customServerUrl?.trim();
  if (custom) {
    try {
      const base = new URL(custom);
      if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash)
        throw new Error('Invalid server URL');
      return normalize(await requestJson(base.href.replace(/\/+$/, '') + '/api/chat', body, 8000));
    }
    catch { /* Fall back safely. */ }
  }

  try {
    return normalize(await requestJson('/api/chat', body, 2500));
  }
  catch { /* Standalone Android has no relative backend. */ }

  return normalize(parseVietnameseFinancialCommand(message, names, cats));
}
