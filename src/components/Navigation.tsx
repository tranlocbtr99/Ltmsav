import React from 'react';
import { LayoutDashboard, ReceiptText, Sparkles, Target, Wallet, Settings, WifiOff, Lock, Sun, Moon } from 'lucide-react';
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

export const TopHeader: React.FC<TopHeaderProps> = ({ isOnline, onNavigateTab, securityEnabled, onLockApp, theme, onToggleTheme }) => {
  const { language, setLanguage, t } = useLanguage();
  return (
    <header className="ios-header pt-safe">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-2 px-4 py-3">
        <button type="button" onClick={() => onNavigateTab('overview')} className="flex items-center gap-2.5 min-w-0 text-left" aria-label="LTMsav">
          <img src="/logo.png" alt="" className="w-10 h-10 rounded-[13px] shrink-0" />
          <div className="min-w-0">
            <span className="block truncate text-[18px] font-bold tracking-[-0.7px] text-slate-900 dark:text-white">LTMsav<span className="text-blue-500">.</span></span>
            <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">{t('appSubtitle')}</span>
          </div>
        </button>
        <div className="ios-toolbar flex items-center gap-0.5 shrink-0">
          <button type="button" onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')} className="ios-tool text-[11px] font-bold" aria-label={t(language === 'vi' ? 'switchToEnglish' : 'switchToVietnamese')}>{language === 'vi' ? 'VI' : 'EN'}</button>
          <button type="button" onClick={onToggleTheme} className="ios-tool" aria-label={t(theme === 'dark' ? 'switchToLight' : 'switchToDark')}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {securityEnabled && onLockApp && <button type="button" onClick={onLockApp} className="ios-tool" aria-label={t('lockNow')}><Lock size={17} /></button>}
          <button type="button" onClick={() => onNavigateTab('settings')} className="ios-tool" aria-label={t('settings')}><Settings size={18} /></button>
        </div>
      </div>
      {!isOnline && <div role="status" className="flex items-center justify-center gap-1.5 pb-2 text-[11px] text-amber-700 dark:text-amber-300"><WifiOff size={12} />{t('offline')}</div>}
    </header>
  );
};

export const BottomNavBar: React.FC<NavigationProps> = ({ currentTab, onTabChange, onOpenAdd }) => {
  const { t } = useLanguage();
  const tabs = [
    { id: 'overview', label: t('overview'), icon: LayoutDashboard },
    { id: 'transactions', label: t('transactions'), icon: ReceiptText },
    { id: 'ai', label: 'AI', icon: Sparkles },
    { id: 'budgets', label: t('budget'), icon: Target },
    { id: 'assets', label: t('assetsNav'), icon: Wallet },
  ];
  return (
    <nav className="ios-dock-wrap" aria-label={t('mainNavigation')}>
      <div className="ios-dock">
        {tabs.map(tab => {
          const active = currentTab === tab.id;
          const Icon = tab.icon;
          return <button key={tab.id} type="button" aria-current={active ? 'page' : undefined} aria-label={tab.id === 'ai' ? 'LTMsav AI' : tab.label}
            onClick={() => tab.id === 'ai' ? onOpenAdd() : onTabChange(tab.id)}
            className={`ios-tab ${active ? 'ios-tab-active' : ''} ${tab.id === 'ai' ? 'ios-tab-ai' : ''}`}>
            <span className="ios-tab-icon"><Icon size={21} strokeWidth={active ? 2.3 : 1.8} /></span>
            <span className="ios-tab-label">{tab.label}</span>
          </button>;
        })}
      </div>
    </nav>
  );
};
