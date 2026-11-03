import React, { useState, useRef, useEffect } from 'react';
import { Account, Category, Transaction, AiChatResponse, AiParsedCommand, AppSettings } from '../types';
import { categoryTypeFor } from '../services/categoryCatalog';
import { processAiMessage } from '../services/aiParser';
import { 
  Sparkles, Send, Bot, User, Check, Edit3, ArrowRight, CornerDownLeft, 
  HelpCircle, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownLeft, ArrowRightLeft 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../contexts/LanguageContext';

interface AiChatTabProps {
  accounts: Account[];
  categories: Category[];
  settings?: AppSettings;
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
  settings,
  onAddTransaction,
  onNavigateTab,
}) => {
  const { t } = useLanguage();

  const SAMPLE_PROMPTS = [
    t('aiQuickExample1'),
    t('aiQuickExample2'),
    t('aiQuickExample3'),
    t('aiQuickExample4'),
    t('aiQuickExample5'),
    t('aiQuickExample6'),
  ];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'bot',
      text: t('aiWelcomeShort'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const executedKeys = useRef(new Set<string>());
  const sending = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || sending.current) return;
    sending.current = true;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const data: AiChatResponse = await processAiMessage(text, accounts, categories, settings);

      let botReply = data.analysis || t('aiAnalyzed');
      if (data.answer) {
        botReply = data.answer;
      }
      if (data.clarification_question) {
        botReply += `\n\n❓ ${data.clarification_question}`;
      }

      const botMsg: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        sender: 'bot',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        response: data,
        executed: false,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      setInputText(text);
      setMessages(prev => [
        ...prev,
        {
          id: 'msg_err_' + Date.now(),
          sender: 'bot',
          text: t('aiError'),
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
      ...m, response: {...m.response, commands: m.response.commands?.map((cmd,i) => i === index ? {...cmd,...updates} : cmd)}
    }));
  };
  const handleExecuteCommand = (messageId: string, cmd: AiParsedCommand, index: number) => {
    const executionKey = `${messageId}:${index}`;
    if (executedKeys.current.has(executionKey)) return;
    executedKeys.current.add(executionKey);
    const matchedAccount = accounts.find(
      a => a.name.toLowerCase() === cmd.account.toLowerCase()
    );

    let matchedTargetAccount = undefined;
    if (cmd.account_to) {
      matchedTargetAccount = accounts.find(
        a => a.name.toLowerCase() === cmd.account_to?.toLowerCase()
      )?.id;
    }

    const matchedCategory = categories.find(
      c => c.name.toLowerCase() === cmd.category.toLowerCase() && c.type === categoryTypeFor(cmd.kind)
    );

    try {
    if (!matchedAccount || !Number.isSafeInteger(cmd.amount) || cmd.amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(cmd.date || '') || (cmd.kind !== 'transfer' && !matchedCategory) || (cmd.kind === 'transfer' && (!matchedTargetAccount || matchedTargetAccount === matchedAccount.id))) throw new Error(t('aiInvalidDraft'));
    onAddTransaction({
      type: cmd.kind,
      amount: cmd.amount,
      accountId: matchedAccount.id,
      targetAccountId: matchedTargetAccount,
      categoryId: matchedCategory?.id || '',
      date: cmd.date || new Date().toISOString().split('T')[0],
      description: cmd.description || t('aiTransaction'),
      note: cmd.note || undefined,
      person: cmd.person || undefined,
    });

    } catch (error) {
      executedKeys.current.delete(executionKey);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), sender: 'bot', text: error instanceof Error ? error.message : String(error), timestamp: new Date().toISOString() }]);
      return;
    }
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const executedCommands = [...(m.executedCommands || []),index];
      return {...m,executedCommands,executed: executedCommands.length === m.response?.commands?.length};
    }));

    try {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch (e) {}
  };

  return (
    <div className="ai-screen finance-screen flex flex-col pb-2">
      
      {/* Header bar */}
      <div className="p-3.5 glass-panel rounded-2xl flex items-center justify-between mb-3 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{t('aiTitle')}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h2>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">{t('aiSubtitle')}</p>
          </div>
        </div>

        <button
          disabled={isLoading} onClick={() => {
            setMessages([
              {
                id: 'msg_welcome_' + Date.now(),
                sender: 'bot',
                text: t('aiCleared'),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }
            ]);
          }}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          title={t('clearChat')}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages stream */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3.5 pr-1">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-2.5 w-full max-w-[95%] sm:max-w-[90%] ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
              msg.sender === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
            }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className="space-y-2.5 flex-1 min-w-0">
              <div className={`p-3 sm:p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm'
              }`}>
                <div className="whitespace-pre-line break-words break-all">{msg.text}</div>
                <div className={`text-[10px] mt-1.5 ${
                  msg.sender === 'user' ? 'text-blue-100' : 'text-slate-500'
                }`}>
                  {msg.timestamp}
                </div>
              </div>

              {/* Parsed Commands Preview Card */}
              {msg.response?.commands && msg.response.commands.length > 0 && (
                <div className="w-full max-w-full p-2.5 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-emerald-500/30 shadow-lg space-y-2.5 sm:space-y-3 animate-fade-in overflow-hidden">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      {t('previewTransaction')}
                    </span>
                    {msg.executed && (
                      <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Check className="w-3 h-3" /> {t('recorded')}
                      </span>
                    )}
                  </div>

                  {msg.response.commands.map((cmd, idx) => (
                    <div key={idx} className="w-full p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-2 text-xs overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm break-words min-w-0 flex-1">
                          {cmd.description}
                        </span>
                        <span className={`font-extrabold text-sm shrink-0 whitespace-nowrap ${
                          cmd.kind === 'expense' ? 'text-rose-600 dark:text-rose-400' :
                          cmd.kind === 'income' ? 'text-emerald-600 dark:text-emerald-400' :
                          cmd.kind === 'transfer' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'
                        }`}>
                          {cmd.kind === 'expense' ? '-' : cmd.kind === 'income' ? '+' : ''}
                          {cmd.amount.toLocaleString('vi-VN')}₫
                        </span>
                      </div>

                      {!msg.executedCommands?.includes(idx) ? <fieldset className="space-y-2">
                        <legend className="text-xs text-slate-600 dark:text-slate-300 mb-2">{t('aiEditHint')}</legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <label className="text-xs">{t('transactionType')}<select className="form-control w-full rounded-xl px-2 mt-1" value={cmd.kind} onChange={e => updateDraft(msg.id,idx,{kind:e.target.value as AiParsedCommand['kind'],category:''})}>{(['expense','income','transfer','lend'] as const).map(kind => <option key={kind} value={kind}>{t(kind === 'lend' ? 'loan' : kind)}</option>)}</select></label>
                          <label className="text-xs">{t('amountVnd')}<input className="form-control w-full rounded-xl px-2 mt-1" inputMode="numeric" value={cmd.amount ? cmd.amount.toLocaleString('vi-VN') : ''} onChange={e => updateDraft(msg.id,idx,{amount:Number(e.target.value.replace(/\D/g,''))})}/></label>
                          <label className="text-xs">{t('source')}<select className="form-control w-full rounded-xl px-2 mt-1" value={accounts.some(a=>a.name === cmd.account) ? cmd.account : ''} onChange={e => updateDraft(msg.id,idx,{account:e.target.value})}><option value="">{t('source')}</option>{accounts.map(a=><option key={a.id} value={a.name}>{a.name}</option>)}</select></label>
                          {cmd.kind === 'transfer' ? <label className="text-xs">{t('toAccount')}<select className="form-control w-full rounded-xl px-2 mt-1" value={cmd.account_to || ''} onChange={e=>updateDraft(msg.id,idx,{account_to:e.target.value})}><option value="">{t('toAccount')}</option>{accounts.filter(a=>a.name !== cmd.account).map(a=><option key={a.id} value={a.name}>{a.name}</option>)}</select></label> : <label className="text-xs">{t('category')}<select className="form-control w-full rounded-xl px-2 mt-1" value={categories.some(c=>c.name === cmd.category && c.type === categoryTypeFor(cmd.kind)) ? cmd.category : ''} onChange={e => updateDraft(msg.id,idx,{category:e.target.value})}><option value="">{t('chooseCategory')}</option>{categories.filter(c=>c.type === categoryTypeFor(cmd.kind)).map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></label>}
                          <label className="text-xs">{t('date')}<input type="date" className="form-control w-full rounded-xl px-2 mt-1" value={cmd.date || ''} onChange={e => updateDraft(msg.id,idx,{date:e.target.value})}/></label>
                          <label className="text-xs">{t('transactionDesc')}<input className="form-control w-full rounded-xl px-2 mt-1" value={cmd.description || ''} onChange={e=>updateDraft(msg.id,idx,{description:e.target.value})}/></label>
                        </div>
                      </fieldset> : <p className="text-xs text-emerald-700 dark:text-emerald-300">{t('recorded')} · {cmd.account} · {cmd.category}</p>}

                      {!msg.executedCommands?.includes(idx) && (
                        <div className="pt-2 flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleExecuteCommand(msg.id, cmd, idx)}
                            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-[11px] sm:text-xs shadow-md shadow-emerald-950 transition active:scale-95 whitespace-nowrap"
                          >
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>{t('confirmAndRecord')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 max-w-[85%] items-center text-xs text-slate-500 dark:text-slate-400 pl-2">
            <div className="w-7 h-7 rounded-xl bg-purple-600/30 flex items-center justify-center text-purple-600 dark:text-purple-400 animate-spin">
              <RefreshCw className="w-3.5 h-3.5" />
            </div>
            <span>{t('aiAnalyzing')}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Chips */}
      <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {SAMPLE_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] whitespace-nowrap transition active:scale-95 shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="glass-panel p-2 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend()}
          aria-label={t('aiInputPlaceholder')} placeholder={t('aiInputPlaceholder')}
          className="flex-1 min-w-0 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
        />
        <button
          onClick={() => handleSend()}
          aria-label={t('aiNavLabel')} disabled={!inputText.trim() || isLoading}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none text-white transition active:scale-95 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
