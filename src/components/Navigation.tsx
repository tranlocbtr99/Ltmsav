import React from 'react';
import { 
  LayoutDashboard, ReceiptText, Sparkles, Target, Wallet, Settings, Plus, WifiOff, Lock, Sun, Moon 
} from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenAdd: () => void;
  isOnline: boolean;
}

interface TopHeaderProps {
  onOpenAdd: () => void;
  isOnline: boolean;
  onNavigateTab: (tab: string) => void;
  securityEnabled: boolean;
  onLockApp?: () => void;
  theme: 'dark' | 'light' | 'system';
  onToggleTheme: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenAdd,
  isOnline,
  onNavigateTab,
  securityEnabled,
  onLockApp,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel px-4 py-3 transition-colors duration-200">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        
        {/* Brand */}
        <div 
          onClick={() => onNavigateTab('overview')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <img src="/icon.svg" alt="LTMsav Logo" className="w-8 h-8 rounded-xl shadow-md shadow-emerald-950/20" />
          <div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight flex items-center gap-1.5 text-slate-900 dark:text-white">
              <span>LTM</span>
              <span className="text-emerald-500 font-black">sav</span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Sổ thu chi & Quản lý tài chính</p>
          </div>
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-2">
          {!isOnline && (
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-bold border border-amber-500/30">
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
            title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>

          {/* Quick Lock Button */}
          {securityEnabled && onLockApp && (
            <button
              onClick={onLockApp}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 text-xs font-semibold border border-slate-200 dark:border-slate-700/60 transition"
              title="Khóa ứng dụng ngay"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span className="hidden xs:inline">Khóa</span>
            </button>
          )}

          <button
            onClick={onOpenAdd}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Ghi Chép</span>
          </button>
        </div>

      </div>
    </header>
  );
};

export const BottomNavBar: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  onOpenAdd,
}) => {
  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'transactions', label: 'Giao dịch', icon: ReceiptText },
    { id: 'ai', label: 'LTMsav AI', icon: Sparkles, highlight: true },
    { id: 'budgets', label: 'Ngân sách', icon: Target },
    { id: 'assets', label: 'Tài sản', icon: Wallet },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-slate-200 dark:border-slate-800/90 pb-safe transition-colors duration-200">
      <div className="max-w-3xl mx-auto px-2 py-1.5 flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          if (tab.highlight) {
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative -top-3.5 flex flex-col items-center group focus:outline-none"
              >
                <div className={`p-3 rounded-2xl shadow-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-purple-900/50 scale-105'
                    : 'bg-gradient-to-tr from-purple-700 to-indigo-600 text-white hover:brightness-110'
                }`}>
                  <Icon className="w-5 h-5 animate-pulse" />
                </div>
                <span className={`text-[10px] mt-0.5 font-bold ${
                  isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-purple-500'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition duration-150 focus:outline-none ${
                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg transition ${
                isActive ? 'bg-emerald-500/15' : ''
              }`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className={`text-[10px] font-medium tracking-tight ${
                isActive ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
