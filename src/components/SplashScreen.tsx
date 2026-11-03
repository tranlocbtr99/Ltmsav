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
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onFinish]);

  return <div className={`silver-splash fixed inset-0 z-[99999] flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
    <div className="silver-splash-mark"><img src="/logo.png" alt="LTMsav"/></div>
    <h1 className="silver-splash-title">LTMsav</h1><p className="silver-splash-subtitle">{t('appSubtitle')}</p>
    <div className="silver-splash-progress" role="status" aria-label={t('initializing')}><span/></div>
    <p className="silver-splash-credit">{t('designedBy')}</p>
  </div>;
};
