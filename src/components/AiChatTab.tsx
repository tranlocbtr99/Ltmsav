import React, { useState, useRef, useEffect } from 'react';
import { Account, Category, Transaction, AiChatResponse, AiParsedCommand, AppSettings } from '../types';
import { processAiMessage } from '../services/aiParser';
import { 
  Sparkles, Send, Bot, User, Check, Edit3, ArrowRight, CornerDownLeft, 
  HelpCircle, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownLeft, ArrowRightLeft 
} from 'lucide-react';
import confetti from 'canvas-confetti';

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
}

const SAMPLE_PROMPTS = [
  'Hôm nay ăn trưa hết 45 nghìn bằng tiền mặt',
  'Nhận lương 22 triệu vào Vietcombank',
  'Chuyển 2 triệu từ tiền mặt sang Vietcombank',
  'Đổ xăng xe máy 80k qua ví MoMo',
  'Tôi cho Tuấn vay 1 triệu từ tiền mặt',
  'Hôm nay tôi đã tiêu bao nhiêu?',
];

export const AiChatTab: React.FC<AiChatTabProps> = ({
  accounts,
  categories,
  settings,
  onAddTransaction,
  onNavigateTab,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'bot',
      text: `Xin chào! Tôi là Trợ lý AI LTMsav.\nBạn có thể nhập câu nói tự nhiên để ghi nhanh giao dịch thu chi mà không cần bấm nhiều bước:\n• "Ăn trưa 45k tiền mặt"\n• "Nhận lương 20 triệu vào Vietcombank"\n• "Chuyển 2 triệu từ tiền mặt sang MoMo"\n• "Cho Tuấn vay 500k từ tiền mặt, hẹn 30 này trả"\nTôi sẽ phân tích và hiển thị bản xem trước để bạn xác nhận!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

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

      let botReply = data.analysis || 'Đã phân tích yêu cầu của bạn.';
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
      setMessages(prev => [
        ...prev,
        {
          id: 'msg_err_' + Date.now(),
          sender: 'bot',
          text: 'Xin lỗi, đã xảy ra lỗi trong quá trình phân tích. Vui lòng thử lại với câu lệnh ngắn gọn hơn.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteCommand = (messageId: string, cmd: AiParsedCommand) => {
    const matchedAccount = accounts.find(
      a => a.name.toLowerCase() === cmd.account.toLowerCase()
    ) || accounts[0];

    let matchedTargetAccount = undefined;
    if (cmd.account_to) {
      matchedTargetAccount = accounts.find(
        a => a.name.toLowerCase() === cmd.account_to?.toLowerCase()
      )?.id;
    }

    const matchedCategory = categories.find(
      c => c.name.toLowerCase() === cmd.category.toLowerCase()
    ) || categories[0];

    onAddTransaction({
      type: cmd.kind,
      amount: cmd.amount,
      accountId: matchedAccount?.id || accounts[0].id,
      targetAccountId: matchedTargetAccount,
      categoryId: matchedCategory?.id || categories[0].id,
      date: cmd.date || new Date().toISOString().split('T')[0],
      description: cmd.description || 'Giao dịch qua AI',
      note: cmd.note || undefined,
      person: cmd.person || undefined,
    });

    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, executed: true } : m));

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch (e) {}
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-160px)] pb-2">
      
      {/* Header bar */}
      <div className="p-3.5 glass-panel rounded-2xl flex items-center justify-between mb-3 border border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Trợ Lý Tài Chính LTMsav AI</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h2>
            <p className="text-[11px] text-slate-400">Hỗ trợ nhận diện câu lệnh tiếng Việt & chuyển thành giao dịch</p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: 'msg_welcome_' + Date.now(),
                sender: 'bot',
                text: 'Hộp thoại đã được làm mới. Hãy nhập câu lệnh mới của bạn!',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }
            ]);
          }}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          title="Xóa đoạn chat"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages stream */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-2.5 max-w-[92%] sm:max-w-[85%] ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
              msg.sender === 'user'
                ? 'bg-emerald-600 text-white'
                : 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
            }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className="space-y-2.5">
              <div className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
              }`}>
                <div className="whitespace-pre-line">{msg.text}</div>
                <div className={`text-[10px] mt-1.5 ${
                  msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-500'
                }`}>
                  {msg.timestamp}
                </div>
              </div>

              {/* Parsed Commands Preview Card */}
              {msg.response?.commands && msg.response.commands.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-lg space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Bản Xem Trước Giao Dịch
                    </span>
                    {msg.executed && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Check className="w-3 h-3" /> Đã ghi sổ
                      </span>
                    )}
                  </div>

                  {msg.response.commands.map((cmd, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">
                          {cmd.description}
                        </span>
                        <span className={`font-extrabold text-sm ${
                          cmd.kind === 'expense' ? 'text-rose-400' :
                          cmd.kind === 'income' ? 'text-emerald-400' :
                          cmd.kind === 'transfer' ? 'text-blue-400' : 'text-purple-400'
                        }`}>
                          {cmd.kind === 'expense' ? '-' : cmd.kind === 'income' ? '+' : ''}
                          {cmd.amount.toLocaleString('vi-VN')}₫
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                        <div>
                          <span>Nguồn: </span>
                          <strong className="text-slate-200">{cmd.account}</strong>
                        </div>
                        {cmd.account_to && (
                          <div>
                            <span>Đến: </span>
                            <strong className="text-slate-200">{cmd.account_to}</strong>
                          </div>
                        )}
                        <div>
                          <span>Danh mục: </span>
                          <strong className="text-slate-200">{cmd.category}</strong>
                        </div>
                        <div>
                          <span>Ngày: </span>
                          <strong className="text-slate-200">{cmd.date}</strong>
                        </div>
                      </div>

                      {!msg.executed && (
                        <div className="pt-2 flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleExecuteCommand(msg.id, cmd)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs shadow-md shadow-emerald-950 transition active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Xác Nhận & Ghi Sổ Ngay</span>
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
          <div className="flex gap-2.5 max-w-[85%] items-center text-xs text-slate-400 pl-2">
            <div className="w-7 h-7 rounded-xl bg-purple-600/30 flex items-center justify-center text-purple-400 animate-spin">
              <RefreshCw className="w-3.5 h-3.5" />
            </div>
            <span>LTMsav AI đang phân tích câu lệnh...</span>
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
            className="px-2.5 py-1 rounded-xl bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 text-[11px] whitespace-nowrap transition active:scale-95"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="glass-panel p-2 rounded-2xl border border-slate-800 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Nhập câu nói: vd Ăn sáng 30k tiền mặt..."
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white transition active:scale-95 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
