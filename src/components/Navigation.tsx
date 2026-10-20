import React from 'react';
import { 
  LayoutDashboard, ReceiptText, Sparkles, Target, Wallet, Settings, Plus, WifiOff, Lock, Sun, Moon, Globe 
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

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
  isOnline,
  onNavigateTab,
  securityEnabled,
  onLockApp,
  theme,
  onToggleTheme,
}) => {
  const { language, setLanguage, t } = useLanguage();
  return (
    <header className="sticky top-0 z-40 w-full glass-panel pt-safe transition-colors duration-200">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Brand */}
        <div 
          onClick={() => onNavigateTab('overview')}
          className="flex items-center gap-2.5 cursor-pointer min-w-0"
        >
          <img src="/logo.png" alt="LTMsav Logo" className="w-8 h-8 rounded-xl object-contain shadow-md shadow-emerald-950/20 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight flex items-center gap-1.5 text-slate-900 dark:text-white">
              <span>LTM</span>
              <span className="text-emerald-500 font-black">sav</span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">{t('appSubtitle')}</p>
          </div>
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isOnline && (
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-bold border border-amber-500/30">
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </div>
          )}

          {/* Language Toggle Button */}
          <button
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition active:scale-95 text-[10px] font-black"
            title={t(language === 'vi' ? 'switchToEnglish' : 'switchToVietnamese')}
          >
            {language === 'vi' ? 'VI' : 'EN'}
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition active:scale-95"
            title={t(theme === 'dark' ? 'switchToLight' : 'switchToDark')}
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
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 transition active:scale-95"
              title={t('lockNow')}
            >
              <Lock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </button>
          )}

          {/* LTMsav AI - centered in the top bar */}
          <button
            onClick={() => onNavigateTab('ai')}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-950/20 transition active:scale-95"
            title="LTMsav AI"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI</span>
          </button>

          {/* Settings shortcut moved to the top bar */}
          <button
            onClick={() => onNavigateTab('settings')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 transition active:scale-95"
            title={t('settings')}
          >
            <Settings className="w-4 h-4" />
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
  const { t } = useLanguage();
  const leftTabs = [
    { id: 'overview', label: t('overview'), icon: LayoutDashboard },
    { id: 'transactions', label: t('transactions'), icon: ReceiptText },
  ];
  const rightTabs = [
    { id: 'budgets', label: t('budget'), icon: Target },
    { id: 'assets', label: t('assetsAndDebts'), icon: Wallet },
  ];

  const renderTab = (tab: { id: string; label: string; icon: typeof LayoutDashboard }) => {
    const Icon = tab.icon;
    const isActive = currentTab === tab.id;
    return (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-full transition duration-150 focus:outline-none ${
          isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <div className={`p-2 rounded-full transition ${
          isActive ? 'bg-emerald-500/15' : ''
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`text-[10px] font-medium tracking-tight ${
          isActive ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
        }`}>
          {tab.label}
        </span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-slate-200 dark:border-slate-800/90 pb-safe transition-colors duration-200">
      <div className="max-w-3xl mx-auto px-2 py-1.5 flex items-stretch justify-between relative">

        {/* Left group */}
        <div className="flex-1 flex items-center justify-around">
          {leftTabs.map(renderTab)}
        </div>

        {/* Center: Add transaction (thumb-friendly) */}
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={onOpenAdd}
            className="flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:brightness-110 text-white rounded-full shadow-lg shadow-emerald-900/25 transition active:scale-95"
            title={t('addTransaction')}
            aria-label={t('addTransaction')}
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Right group */}
        <div className="flex-1 flex items-center justify-around">
          {rightTabs.map(renderTab)}
        </div>

      </div>
    </nav>
  );
};
