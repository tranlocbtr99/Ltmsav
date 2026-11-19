import React, { useState } from 'react';
import { AiAdvisoryItem } from '../services/aiAdvisory';
import { Sparkles, AlertTriangle, Info, CheckCircle2, ChevronRight, X } from 'lucide-react';

interface AiAdvisoryWidgetProps {
  items: AiAdvisoryItem[];
  onNavigateTab?: (tab: string) => void;
}

export const AiAdvisoryWidget: React.FC<AiAdvisoryWidgetProps> = ({
  items,
  onNavigateTab
}) => {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const visibleItems = items.filter(it => !dismissedIds.includes(it.id));
  if (visibleItems.length === 0) return null;

  return (
    <div className="space-y-2 mb-3">
      {visibleItems.slice(0, 2).map((item) => {
        const isAlert = item.type === 'alert';
        const isWarning = item.type === 'warning';
        const isSuccess = item.type === 'success';

        const bgClass = isAlert
          ? 'bg-rose-500/10 border-rose-500/25 text-rose-800 dark:text-rose-200'
          : isWarning
          ? 'bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-200'
          : isSuccess
          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-200'
          : 'bg-blue-500/10 border-blue-500/25 text-blue-800 dark:text-blue-200';

        const iconColor = isAlert ? 'text-rose-500' : isWarning ? 'text-amber-500' : isSuccess ? 'text-emerald-500' : 'text-blue-500';

        return (
          <div
            key={item.id}
            className={`p-3 rounded-2xl border text-xs flex items-start justify-between gap-2.5 transition backdrop-blur-sm ${bgClass}`}
          >
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <div className="mt-0.5 shrink-0">
                {isAlert ? (
                  <AlertTriangle className={`w-4 h-4 ${iconColor}`} />
                ) : isSuccess ? (
                  <CheckCircle2 className={`w-4 h-4 ${iconColor}`} />
                ) : (
                  <Sparkles className={`w-4 h-4 ${iconColor}`} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-bold text-[12px] leading-tight flex items-center gap-1.5">
                  <span>{item.title}</span>
                </div>
                <p className="text-[11px] opacity-90 leading-normal mt-0.5">
                  {item.message}
                </p>

                {item.actionLabel && onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => item.actionTab && onNavigateTab(item.actionTab)}
                    className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold underline hover:opacity-80"
                  >
                    <span>{item.actionLabel}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDismissedIds(prev => [...prev, item.id])}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full shrink-0"
              title="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

