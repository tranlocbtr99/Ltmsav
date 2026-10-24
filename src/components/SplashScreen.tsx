import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { t } = useLanguage();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 1600);
    const t2 = setTimeout(() => onFinish(), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center ios-splash transition-opacity duration-500 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent dark:from-blue-500/10" />
      <div className="relative flex flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-6">
          <div className="absolute -inset-6 rounded-full bg-blue-500/20 dark:bg-blue-500/25 blur-3xl animate-pulse" />
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
            <img src="/logo.png" alt="LTMsav Logo" className="w-full h-full rounded-[28px] object-contain shadow-2xl shadow-blue-500/20" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-3 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-200">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">LTM</h1>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-blue-500">sav</h1>
        </div>

        <p className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300">
          {t('splashSubtitle')}
        </p>

        <div className="mt-8 space-y-1 animate-in slide-in-from-bottom-6 fade-in duration-700 delay-500">
          <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{t('hello')}</p>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">{t('welcomeTo')}</p>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">{t('thankYou')}</p>
        </div>

        <div className="mt-10 flex items-center gap-2 animate-in fade-in duration-700 delay-700">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="mt-3 text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 animate-pulse">{t('initializing')}</p>
      </div>

      <div className="absolute bottom-6 sm:bottom-8 text-center text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 animate-in fade-in duration-700 delay-900">
        © 2026 LTMsav • {t('designedBy')}
      </div>
    </div>
  );
};
