import React from 'react';
import { 
  House, ReceiptText, Sparkles, CalendarDays, Wallet, UserRound, WifiOff, Lock, Sun, Moon
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenAdd: () => void;
  isOnline: boolean;
}

interface TopHeaderProps {
  currentTab?: string;
  isOnline: boolean;
  onNavigateTab: (tab: string) => void;
  securityEnabled: boolean;
  onLockApp?: () => void;
  theme: 'dark' | 'light' | 'system';
  onToggleTheme: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  isOnline,
  onNavigateTab,
  securityEnabled,
  onLockApp,
  theme,
  onToggleTheme,
}) => {
  const { t } = useLanguage();
  return (
    <header className="finance-header sticky top-0 z-40 w-full glass-panel pt-safe transition-colors duration-200">
      <div className="finance-header-inner max-w-3xl mx-auto px-4 py-2 flex items-center justify-between gap-2">
        
        {/* Brand */}
        <button type="button" aria-label={t('homeNav')}
          onClick={() => onNavigateTab('overview')}
          className="flex items-center gap-2.5 cursor-pointer min-w-0"
        >
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-1.5 text-slate-900 dark:text-white">
              <span>LTM</span>
              <span className="font-bold">sav</span>
            </h1>
            <p className="finance-brand-subtitle text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">{t('appSubtitle')}</p>
          </div>
        </button>

        {/* Right tools */}
        <div className="finance-header-tools flex items-center gap-1.5 shrink-0">
          {!isOnline && (
            <div className="flex items-center gap-1 p-2 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-bold border border-amber-500/30">
              <WifiOff className="w-3 h-3" />
              <span className="sr-only">Offline</span>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="header-tool"
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
              className="header-tool"
              title={t('lockNow')}
            >
              <Lock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </button>
          )}

          <button type="button" onClick={() => onNavigateTab('settings')}
            aria-label={t('profileNav')} title={t('profileNav')}
            aria-current={currentTab === 'settings' ? 'page' : undefined}
            className="header-profile">
            <UserRound size={21} strokeWidth={1.8} aria-hidden="true" />
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
    { id: 'overview', label: t('homeNav'), icon: House },
    { id: 'transactions', label: t('transactions'), icon: ReceiptText },
  ];
  const middleTabs = [
    { id: 'ai', label: 'Nhập bằng AI', icon: Sparkles },
    { id: 'assets', label: t('assetsNav'), icon: Wallet },
  ];
  const rightTabs = [
    { id: 'budgets', label: t('planNav'), icon: CalendarDays },
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
        data-ai={tab.id === 'ai' || undefined}
        onClick={() => onTabChange(tab.id)}
        className="finance-nav-tab transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
      >
        <div>
          <Icon className="w-5 h-5" />
        </div>
        <span>
          {tab.id === 'ai' ? 'AI' : label}
        </span>
      </button>
    );
  };

  return (
    <nav className="finance-nav fixed z-40 glass-panel transition-colors duration-200">
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
