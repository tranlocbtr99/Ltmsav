import { confirmAction } from './Confirmation';
import { resolveAiDraft, parseDraftAmount, aiTransactionFingerprint } from '../services/aiFinancial';
import { DateField } from './DateField';
import { IOSSelect } from './IOSSelect';
import React, { useState, useRef, useEffect } from 'react';
import { Account, Category, Transaction, AiChatResponse, AiParsedCommand, AppSettings, DebtOrLoan, Budget } from '../types';
import { categoryTypeFor } from '../services/categoryCatalog';
import { processAiMessage } from '../services/aiParser';
import { 
  Sparkles, Send, Bot, User, Check, Edit3, ArrowRight, CornerDownLeft, 
  HelpCircle, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownLeft, ArrowRightLeft,
  Copy, CheckCheck, Wallet, ShoppingBag, TrendingUp, CreditCard, ShieldAlert,
  ChevronDown, ChevronUp, Zap, MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../contexts/LanguageContext';
import { DynamicIcon } from './DynamicIcon';

interface AiChatTabProps {
  accounts: Account[];
  categories: Category[];
  debts?: DebtOrLoan[];
  budgets?: Budget[];
  settings?: AppSettings;
  transactions: Transaction[];
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onNavigateTab: (tab: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  response?: AiChatResponse;
  executed?: boolean;
  executedCommands?: number[];
}

export const AiChatTab: React.FC<AiChatTabProps> = ({
  accounts,
  categories,
  debts,
  budgets,
  settings,
  transactions,
  onAddTransaction,
  onNavigateTab,
}) => {
  const { t } = useLanguage();

  const QUICK_PROMPTS = [
    { label: '⚡ Ăn bún bò 45k tiền mặt', text: 'vừa ăn bún bò 45k tiền mặt' },
    { label: '☕ Cafe Highland 55k Momo', text: 'uống cafe Highland 55k bằng Momo' },
    { label: '📊 Tình hình tài chính thế nào?', text: 'Tình hình tài chính hiện tại của tôi thế nào? Dòng tiền tháng này ra sao?' },
    { label: '🛍️ Có nên mua điện thoại 15tr?', text: 'Tôi có nên mua chiếc điện thoại 15 triệu vào lúc này không?' },
    { label: '💳 Khoản nợ nào sắp đến hạn?', text: 'Tôi có khoản nợ hay thẻ tín dụng nào sắp đến hạn thanh toán không?' },
    { label: '💡 Gợi ý cách tiết kiệm tháng này', text: 'Dựa vào chi tiêu thực tế, hãy gợi ý cho tôi cách tiết kiệm tốt hơn trong tháng này' },
    { label: '💸 Chuyển 2tr từ VCB sang MB', text: 'chuyển 2 triệu từ Vietcombank sang MB Bank' },
    { label: '💰 Nhận lương 15tr vào VCB', text: 'nhận lương 15 triệu vào Vietcombank' },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'bot',
      text: 'Xin chào! Tôi là **LTM AI** — Trợ lý tài chính cá nhân thông minh của bạn. 🤖✨\n\nTôi có thể giúp bạn:\n- ⚡ **Ghi chép siêu tốc**: Nhập tự nhiên như *"ăn trưa 45k tiền mặt"*, *"uống cafe 55k momo"* để tạo bản nháp 1-chạm.\n- 📊 **Cố vấn dòng tiền**: Giải đáp thắc mắc tài chính dựa trên **tài sản, thẻ tín dụng, nợ trả góp và chi tiêu thực tế** của bạn.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingDraftIdx, setEditingDraftIdx] = useState<string | null>(null);

  const executedKeys = useRef(new Set<string>());
  const sending = useRef(false);
  const savedFingerprints = useRef(new Set<string>());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' 
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || sending.current) return;
    sending.current = true;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const data: AiChatResponse = await processAiMessage(
        text, 
        accounts, 
        categories, 
        settings, 
        { debts, budgets, transactions }
      );

      let botReply = data.answer || data.analysis || t('aiAnalyzed');
      if (data.clarification_question) {
        botReply += `\n\n❓ *${data.clarification_question}*`;
      }

      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'bot',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        response: data,
        executed: false,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      setInputText(prev => prev || text);
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: 'bot',
          text: 'Rất tiếc, đã có lỗi kết nối với trợ lý AI. Vui lòng kiểm tra kết nối mạng hoặc thử lại.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      sending.current = false;
      setIsLoading(false);
    }
  };

  const updateDraft = (messageId: string, index: number, updates: Partial<AiParsedCommand>) => {
    setMessages(prev => prev.map(m => m.id !== messageId || !m.response ? m : {
      ...m, response: {
        ...m.response, 
        commands: m.response.commands?.map((cmd, i) => i === index ? { ...cmd, ...updates } : cmd)
      }
    }));
  };

  const handleExecuteCommand = async (messageId: string, cmd: AiParsedCommand, index: number) => {
    const executionKey = `${messageId}:${index}`;
    if (executedKeys.current.has(executionKey)) return;
    executedKeys.current.add(executionKey);

    try {
      const resolved = resolveAiDraft(cmd, accounts, categories);
      if (!resolved) throw new Error(t('aiInvalidDraft'));
      const fingerprint = aiTransactionFingerprint(resolved);
      if ((savedFingerprints.current.has(fingerprint) || transactions.some(tx => aiTransactionFingerprint(tx) === fingerprint)) && !await confirmAction(t('aiDuplicateWarning'), { title: t('aiDuplicateTitle'), confirmLabel: t('confirmAndRecord') })) {
        executedKeys.current.delete(executionKey);
        return;
      }
      onAddTransaction({ ...resolved });
      savedFingerprints.current.add(fingerprint);
    } catch (error) {
      executedKeys.current.delete(executionKey);
      setMessages(prev => [...prev, { 
        id: crypto.randomUUID(), 
        sender: 'bot', 
        text: error instanceof Error ? error.message : String(error), 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
      return;
    }

    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const executedCommands = [...(m.executedCommands || []), index];
      return { ...m, executedCommands, executed: executedCommands.length === m.response?.commands?.length };
    }));

    try {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.8 },
          colors: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B']
        });
      }
    } catch (e) {}
  };

  // Helper format Markdown content
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed break-words text-xs sm:text-[13px]">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1.5" />;

          // Heading
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white pt-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span>{line.replace('### ', '')}</span>
              </h4>
            );
          }
          if (line.startsWith('## ') || line.startsWith('# ')) {
            return (
              <h3 key={idx} className="font-black text-base text-slate-900 dark:text-white pt-1.5">
                {line.replace(/^#+\s*/, '')}
              </h3>
            );
          }

          // Bullet points
          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            const cleanText = line.trim().replace(/^[-*]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cleanText) }} />
              </div>
            );
          }

          // Numbered list
          const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="font-bold text-purple-600 dark:text-purple-400 shrink-0">{numMatch[1]}.</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(numMatch[2]) }} />
              </div>
            );
          }

          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInlineMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[11px] text-purple-600 dark:text-purple-400">$1</code>');
  };

  return (
    <div className="ai-screen finance-screen flex flex-col h-[calc(100vh-140px)] max-w-3xl mx-auto pb-2">
      
      {/* Liquid Glass Header bar */}
      <div className="liquid-glass p-3 rounded-3xl mb-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600/20 to-indigo-500/20 flex items-center justify-center p-0.5 shadow-md ring-2 ring-purple-400/30 overflow-hidden">
              <img src="/illustrations/ai-finance-mascot.svg" alt="LTM AI" className="w-full h-full object-contain" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                LTM AI Financial
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap shrink-0">
                Gemini Flash
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap truncate">
              Trợ lý tài chính cá nhân thông minh
            </p>
          </div>
        </div>

        <button 
          type="button" 
          disabled={isLoading} 
          title={t('clearChat')} 
          aria-label={t('clearChat')} 
          onClick={() => setMessages([{
            id: crypto.randomUUID(),
            sender: 'bot',
            text: 'Đã làm mới cuộc trò chuyện. Bạn muốn ghi nhận giao dịch hay cần tư vấn tài chính điều gì?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }])}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scroll-smooth">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 w-full max-w-[96%] sm:max-w-[90%] transition-all ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${
                isUser
                  ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                  : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white ring-2 ring-purple-500/20'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble Container */}
              <div className="space-y-2.5 flex-1 min-w-0">
                <div 
                  className={`relative p-3.5 sm:p-4 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm shadow-blue-500/10'
                      : 'liquid-glass text-slate-800 dark:text-slate-200 rounded-tl-sm border border-white/20 dark:border-white/10'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-line font-medium break-words">{msg.text}</div>
                  ) : (
                    renderFormattedText(msg.text)
                  )}

                  {/* Footer: Timestamp & Copy action */}
                  <div className={`flex items-center justify-between text-[10px] mt-2 pt-1 border-t ${
                    isUser 
                      ? 'border-white/20 text-blue-100' 
                      : 'border-slate-200/50 dark:border-slate-800/50 text-slate-400'
                  }`}>
                    <span>{msg.timestamp}</span>

                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="flex items-center gap-1 hover:text-purple-600 dark:hover:text-purple-400 transition"
                        title="Sao chép nội dung"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <CheckCheck className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">Đã sao chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Navigation suggestions */}
                {(msg.response?.intent === 'query_balance' || msg.response?.intent === 'query_report') && (
                  <button 
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pl-1" 
                    onClick={() => onNavigateTab(msg.response?.intent === 'query_balance' ? 'assets' : 'reports')}
                  >
                    <span>{t(msg.response?.intent === 'query_balance' ? 'assetsNav' : 'reports')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Parsed Commands Preview Card (Apple Widget Style) */}
                {msg.response?.commands && msg.response.commands.length > 0 && (
                  <div className="w-full liquid-glass p-4 rounded-3xl border border-emerald-500/30 dark:border-emerald-500/20 shadow-xl space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span>Bản nháp giao dịch 1-chạm</span>
                      </span>
                      {msg.executed && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                          <Check className="w-3.5 h-3.5" /> Đã ghi vào sổ
                        </span>
                      )}
                    </div>

                    {msg.response.commands.map((cmd, idx) => {
                      const isExecuted = msg.executedCommands?.includes(idx);
                      const isEditing = editingDraftIdx === `${msg.id}:${idx}`;
                      const isExpense = cmd.kind === 'expense';
                      const isIncome = cmd.kind === 'income';
                      const isTransfer = cmd.kind === 'transfer';
                      const isLend = cmd.kind === 'lend';

                      return (
                        <div 
                          key={idx} 
                          className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5 text-xs shadow-sm"
                        >
                          {/* Card Header: Type badge & Large Amount */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase mb-1 ${
                                isExpense ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                isIncome ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                isTransfer ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                              }`}>
                                {isExpense ? 'Chi tiêu' : isIncome ? 'Thu nhập' : isTransfer ? 'Chuyển tiền' : 'Cho mượn'}
                              </span>
                              <h4 className="font-black text-slate-900 dark:text-white text-sm break-words truncate">
                                {cmd.description}
                              </h4>
                            </div>

                            <span className={`font-black text-base tabular-nums shrink-0 ${
                              isExpense ? 'text-rose-600 dark:text-rose-400' :
                              isIncome ? 'text-emerald-600 dark:text-emerald-400' :
                              isTransfer ? 'text-blue-600 dark:text-blue-400' :
                              'text-purple-600 dark:text-purple-400'
                            }`}>
                              {isExpense ? '-' : isIncome ? '+' : ''}
                              {cmd.amount.toLocaleString('vi-VN')}₫
                            </span>
                          </div>

                          {/* Pills: Account, Category, Date */}
                          <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                            {cmd.account && (
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 font-semibold flex items-center gap-1 border border-slate-200/60 dark:border-slate-800">
                                <Wallet className="w-3 h-3 text-blue-500" />
                                {cmd.account}
                                {cmd.account_to && ` → ${cmd.account_to}`}
                              </span>
                            )}
                            {cmd.category && (
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 font-semibold flex items-center gap-1 border border-slate-200/60 dark:border-slate-800">
                                <ShoppingBag className="w-3 h-3 text-purple-500" />
                                {cmd.category}
                              </span>
                            )}
                            {cmd.date && (
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-500 border border-slate-200/60 dark:border-slate-800">
                                {cmd.date}
                              </span>
                            )}
                          </div>

                          {/* Collapsible Edit Sheet if user wants to tweak */}
                          {isEditing && !isExecuted && (
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 animate-fade-in">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <label className="text-[11px] font-semibold text-slate-500">
                                  {t('amountVnd')}
                                  <input 
                                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold mt-1 text-slate-900 dark:text-white" 
                                    inputMode="numeric" 
                                    value={cmd.amount ? cmd.amount.toLocaleString('vi-VN') : ''} 
                                    onChange={e => updateDraft(msg.id, idx, { amount: parseDraftAmount(e.target.value) })}
                                  />
                                </label>
                                <label className="text-[11px] font-semibold text-slate-500">
                                  {t('source')}
                                  <IOSSelect 
                                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mt-1" 
                                    label={t('source')} 
                                    value={cmd.account_id || ''} 
                                    onChange={e => updateDraft(msg.id, idx, {
                                      account_id: e.target.value,
                                      account: accounts.find(a => a.id === e.target.value)?.name || ''
                                    })}
                                  >
                                    <option value="">{t('source')}</option>
                                    {accounts.map(a => (
                                      <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                  </IOSSelect>
                                </label>
                              </div>
                            </div>
                          )}

                          {/* Action Footer */}
                          {!isExecuted && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingDraftIdx(isEditing ? null : `${msg.id}:${idx}`)}
                                className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>{isEditing ? 'Đóng chỉnh sửa' : 'Tùy chỉnh'}</span>
                              </button>

                              <button
                                disabled={!resolveAiDraft(cmd, accounts, categories)}
                                onClick={() => handleExecuteCommand(msg.id, cmd, idx)}
                                className="disabled:opacity-40 flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl text-xs shadow-md shadow-emerald-900/20 transition active:scale-95"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Xác nhận ghi sổ</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-2.5 max-w-[85%] items-center text-xs text-slate-500 dark:text-slate-400 pl-2 animate-fade-in">
            <div className="w-8 h-8 rounded-2xl bg-purple-600/20 flex items-center justify-center text-purple-600 dark:text-purple-400 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 liquid-glass px-3 py-2 rounded-2xl">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 ml-1">LTM AI đang suy nghĩ & phân tích...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Carousel (iOS Chip Pills) */}
      <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {QUICK_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p.text)}
            className="liquid-pill px-3 py-1.5 rounded-full text-slate-700 dark:text-slate-200 text-[11px] font-bold whitespace-nowrap shrink-0 hover:border-purple-400 transition"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input Box: Apple Floating Liquid Dock */}
      <div className="liquid-glass p-2 rounded-3xl border border-slate-200/80 dark:border-white/10 flex items-center gap-2 shrink-0 shadow-lg">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend()}
          maxLength={4000} 
          aria-label={t('aiInputPlaceholder')} 
          placeholder="Nhập giao dịch (ăn phở 45k) hoặc câu hỏi tài chính..."
          className="flex-1 min-w-0 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-medium"
        />
        <button
          onClick={() => handleSend()}
          aria-label={t('aiNavLabel')} 
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white transition active:scale-90 shadow-md shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
