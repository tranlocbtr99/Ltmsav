import type { Account, Category, AiChatResponse, AppSettings } from '../types';
import { aiPrompt, localDay, normalizeAiResponse, parseVietnameseFinancialCommand, nonPostingReason, isAiQuery } from './aiFinancial';
export { parseVietnameseFinancialCommand } from './aiFinancial';
async function requestJson(url: string, body: unknown, timeout: number): Promise<unknown> {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
        if (!response.ok)
            throw new Error('AI service unavailable');
        const text = await response.text();
        if (text.length > 100000)
            throw new Error('AI response too large');
        return JSON.parse(text);
    }
    finally {
        clearTimeout(timer);
    }
}
export async function processAiMessage(message: string, accounts: Account[], categories: Category[], settings?: AppSettings): Promise<AiChatResponse> {
    if (!message.trim() || message.length > 4000)
        throw new Error('Nội dung phải từ 1 đến 4.000 ký tự.');
    const names = accounts.map(a => a.name), cats = categories.map(c => c.name), today = localDay();
    const normalize = (raw: unknown) => normalizeAiResponse(raw, message, accounts, categories);
    // Questions and non-posting requests cannot be turned into writes by any provider.
    if (nonPostingReason(message) || isAiQuery(message))
        return parseVietnameseFinancialCommand(message, names, cats);
    const key = settings?.geminiApiKey?.trim();
    if (key)
        try {
            const raw = await requestJson(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`, { systemInstruction: { parts: [{ text: aiPrompt(accounts, categories, today) }] }, contents: [{ role: 'user', parts: [{ text: message }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0 } }, 12000) as any;
            const text = raw?.candidates?.[0]?.content?.parts?.map((part: any) => typeof part.text === 'string' ? part.text : '').join('');
            if (!text)
                throw new Error('Empty AI output');
            return normalize(JSON.parse(text));
        }
        catch { /* Never log messages, financial context or API-key-bearing URLs. */ }
    const body = { message, accounts: names, categories: cats, categoryDetails: categories.map(c => ({ name: c.name, type: c.type })), localDate: today };
    const custom = settings?.customServerUrl?.trim();
    if (custom)
        try {
            const base = new URL(custom);
            if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash)
                throw new Error('Invalid server URL');
            return normalize(await requestJson(base.href.replace(/\/+$/, '') + '/api/chat', body, 8000));
        }
        catch { /* Fall back safely. */ }
    try {
        return normalize(await requestJson('/api/chat', body, 2500));
    }
    catch { /* Standalone Android has no relative backend. */ }
    return normalize(parseVietnameseFinancialCommand(message, names, cats));
}
