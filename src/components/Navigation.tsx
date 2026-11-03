import React from 'react';
import { 
  House, ReceiptText, Sparkles, CalendarDays, Wallet, UserRound, Settings, WifiOff, Lock, Sun, Moon 
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenAdd: () => void;
  isOnline: boolean;
}

interface TopHeaderProps {
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
    <header className="finance-header sticky top-0 z-40 w-full glass-panel pt-safe transition-colors duration-200">
      <div className="max-w-3xl mx-auto px-4 py-1 flex items-center justify-between">
        
        {/* Brand */}
        <button type="button" aria-label={t('homeNav')}
          onClick={() => onNavigateTab('overview')}
          className="flex items-center gap-2.5 cursor-pointer min-w-0"
        >
          <img src="/logo.png" alt="LTMsav Logo" className="w-8 h-8 rounded-xl object-contain shadow-md shadow-emerald-950/20 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight flex items-center gap-1.5 text-slate-900 dark:text-white">
              <span>LTM</span>
              <span className="text-blue-600 dark:text-blue-300 font-black">sav</span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">{t('appSubtitle')}</p>
          </div>
        </button>

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
              <Sun className="w-4 h-4 text-amber-500 dark:text-amber-400" />
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
    { id: 'overview', label: t('homeNav'), icon: House },
    { id: 'transactions', label: t('transactions'), icon: ReceiptText },
  ];
  const middleTabs = [
    { id: 'ai', label: 'Nhập bằng AI', icon: Sparkles },
    { id: 'assets', label: t('assetsNav'), icon: Wallet },
  ];
  const rightTabs = [
    { id: 'budgets', label: t('planNav'), icon: CalendarDays },
    { id: 'settings', label: t('profileNav'), icon: UserRound },
  ];

  const renderTab = (tab: { id: string; label: string; icon: typeof House }) => {
    const Icon = tab.icon;
    const label = tab.id === 'ai' ? t('aiNavLabel') : tab.label;
    const isActive = currentTab === tab.id;
    return (
      <button
        key={tab.id}
        type="button"
        aria-current={isActive ? 'page' : undefined}
        aria-label={label}
        onClick={() => onTabChange(tab.id)}
        className="finance-nav-tab transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
      >
        <div>
          <Icon className="w-5 h-5" />
        </div>
        <span>
          {label}
        </span>
      </button>
    );
  };

  return (
    <nav className="finance-nav fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-slate-200 dark:border-slate-800/90 pb-safe transition-colors duration-200">
      <div className="finance-nav-inner max-w-3xl mx-auto">

        {/* Left group */}
        <div className="finance-nav-group">
          {leftTabs.map(renderTab)}
        </div>

        {/* Center: AI entry and asset management */}
        <div className="finance-nav-group">
          {middleTabs.map(renderTab)}
        </div>

        {/* Right group */}
        <div className="finance-nav-group">
          {rightTabs.map(renderTab)}
        </div>

      </div>
    </nav>
  );
};
