import { AssetSheet } from './AssetSheet';
import { DynamicIcon } from './DynamicIcon';
import { confirmAction } from './Confirmation';
import React, { useState, useRef, useEffect } from 'react';
import { AppSettings, AuditLog } from '../types';
import { 
  Lock, Fingerprint, KeyRound, HardDrive, RotateCcw, Shield, Check, 
  AlertCircle, History, FileDown, FileUp, Mail, User, 
  Sun, Moon, Monitor, Database, ShieldCheck, RefreshCw, Sparkles, Globe,
  Heart, Copy, X, Cloud, CloudUpload, CloudDownload, LogOut, ArrowDownToLine, Target
} from 'lucide-react';
import { storage } from '../services/storage';
import { useLanguage } from '../contexts/LanguageContext';
import { firebaseAuthService, GoogleUserInfo } from '../services/firebaseAuth';
import { checkAppUpdate } from '../services/updateManager';

import release from '../../release.json';
const APP_VERSION = release.versionName;

interface SettingsTabProps {
  settings: AppSettings;
  auditLogs: AuditLog[];
  onUpdateSettings: (settings: AppSettings) => void;
  onExportBackup: () => void;
  onImportBackup: (json: string) => { success: boolean; message: string };
  onResetData: () => void;
  onLockAppNow: () => void;
  onDeleteAccount?: () => Promise<void> | void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  auditLogs,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onResetData,
  onLockAppNow,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [importMessage, setImportMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isPersisted, setIsPersisted] = useState(false);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportCopied, setSupportCopied] = useState(false);

  // PIN change modal state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  // Google Auth & Cloud Sync state
  const [googleUser, setGoogleUser] = useState<GoogleUserInfo | null>(firebaseAuthService.getCurrentUser());
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(firebaseAuthService.getLastSyncTime());
  const [quickEmailInput, setQuickEmailInput] = useState('');
  const [showQuickEmail, setShowQuickEmail] = useState(false);

  // Personal Financial Profile state
  const [profileAllowance, setProfileAllowance] = useState(settings.userProfile?.monthlyAllowance?.toString() || '');
  const [profileIncomeDay, setProfileIncomeDay] = useState(settings.userProfile?.incomeDayOfMonth?.toString() || '5');
  const [profilePartTime, setProfilePartTime] = useState(settings.userProfile?.partTimeIncome?.toString() || '');
  const [profileGoal, setProfileGoal] = useState(settings.userProfile?.financialGoal || '');
  const [profileGoalAmount, setProfileGoalAmount] = useState(settings.userProfile?.targetGoalAmount?.toString() || '');
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  // OTA update check state
  const [otaStatus, setOtaStatus] = useState<string | null>(null);
  const [isCheckingOta, setIsCheckingOta] = useState(false);

  useEffect(() => {
    const unsubscribe = firebaseAuthService.onUserChange((user) => {
      setGoogleUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsSyncing(true);
      setSyncStatusMsg(null);
      await firebaseAuthService.signInWithGoogle();
      setSyncStatusMsg({ text: t('googleLinked'), isError: false });
    } catch (err: any) {
      setSyncStatusMsg({ text: err.message || t('syncFailed'), isError: true });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await firebaseAuthService.signOut();
      setSyncStatusMsg(null);
    } catch (err: any) {
      setSyncStatusMsg({ text: err.message || 'Lỗi đăng xuất', isError: true });
    }
  };

  const handleCloudUpload = async () => {
    try {
      setIsSyncing(true);
      const res = await firebaseAuthService.syncToCloud();
      if (res.success) {
        setLastSyncTime(res.timestamp || new Date().toISOString());
        setSyncStatusMsg({ text: t('syncSuccess'), isError: false });
      } else {
        setSyncStatusMsg({ text: res.message || t('syncFailed'), isError: true });
      }
    } catch (err: any) {
      setSyncStatusMsg({ text: err.message || t('syncFailed'), isError: true });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloudDownload = async () => {
    const confirmed = await confirmAction(t('confirmRestoreCloud'), { destructive: false });
    if (!confirmed) return;
    try {
      setIsSyncing(true);
      const res = await firebaseAuthService.syncFromCloud();
      if (res.success) {
        setLastSyncTime(res.timestamp || new Date().toISOString());
        setSyncStatusMsg({ text: t('syncSuccess'), isError: false });
        window.location.reload();
      } else {
        setSyncStatusMsg({ text: res.message || t('syncFailed'), isError: true });
      }
    } catch (err: any) {
      setSyncStatusMsg({ text: err.message || t('syncFailed'), isError: true });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveProfile = () => {
    const updatedProfile = {
      monthlyAllowance: parseFloat(profileAllowance.replace(/\D/g, '')) || 0,
      incomeDayOfMonth: Math.min(31, Math.max(1, parseInt(profileIncomeDay, 10) || 5)),
      partTimeIncome: parseFloat(profilePartTime.replace(/\D/g, '')) || 0,
      financialGoal: profileGoal.trim(),
      targetGoalAmount: parseFloat(profileGoalAmount.replace(/\D/g, '')) || 0,
    };
    onUpdateSettings({
      ...settings,
      userProfile: updatedProfile
    });
    setProfileSavedMsg(true);
    setTimeout(() => setProfileSavedMsg(false), 3000);
  };

  const handleCheckOta = async () => {
    try {
      setIsCheckingOta(true);
      setOtaStatus(t('otaChecking'));
      const info = await checkAppUpdate(APP_VERSION);
      if (info.isUpdateAvailable) {
        setOtaStatus(`Đã có bản mới v${info.latestVersion}! Đang mở trang tải...`);
        if (info.downloadUrl) {
          window.open(info.downloadUrl, '_blank');
        }
      } else {
        setOtaStatus(t('otaLatestVersion'));
      }
    } catch {
      setOtaStatus('Không thể kết nối máy chủ cập nhật.');
    } finally {
      setIsCheckingOta(false);
    }
  };

  useEffect(() => {
    // Check persistence status
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then(res => setIsPersisted(res));
    }
    setSnapshots(storage.getAutoSnapshots());
  }, []);

  const handleRequestPersistence = async () => {
    const granted = await storage.requestPersistentStorage();
    setIsPersisted(granted);
    if (granted) {
      setImportMessage({ text: t('persistentStorageGranted'), isError: false });
    } else {
      setImportMessage({ text: t('persistentStorageDenied'), isError: true });
    }
    setTimeout(() => setImportMessage(null), 4000);
  };

  const handleCreateSnapshot = () => {
    storage.createAutomaticSnapshot(t('manualSnapshotReason'));
    setSnapshots(storage.getAutoSnapshots());
    setImportMessage({ text: t('snapshotCreated'), isError: false });
    setTimeout(() => setImportMessage(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = onImportBackup(content);
        setImportMessage({ text: result.message, isError: !result.success });
        setTimeout(() => setImportMessage(null), 4000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4 || newPin.length > 6) {
      setPinError(t('pinLengthError'));
      return;
    }
    if (newPin !== confirmPin) {
      setPinError(t('pinMismatch'));
      return;
    }

    onUpdateSettings({
      ...settings,
      pinCode: newPin,
      securityEnabled: true,
    });

    setPinSuccess(t('pinChangedSuccess'));
    setTimeout(() => {
      setIsPinModalOpen(false);
      setNewPin('');
      setConfirmPin('');
      setPinError('');
      setPinSuccess('');
    }, 1200);
  };

  return (
    <div className="finance-screen settings-groups mb-6">
      
      {/* 1. Theme Configuration (Giao diện Sáng / Tối) */}
      <h2 className="silver-settings-group">{t('experienceGroup')}</h2><details className="silver-settings-section"><summary><span className="silver-settings-icon"><DynamicIcon name="Palette" className="w-5 h-5"/></span><span className="silver-settings-name">{t('theme')}</span><small>{t(settings.theme)}</small><span aria-hidden="true">›</span></summary><div className="glass-card p-5 rounded-3xl border space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-500 dark:text-indigo-400">
            {settings.theme === 'light' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-400" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('theme')}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('themeDesc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition ${
              settings.theme === 'light'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>{t('light')}</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition ${
              settings.theme === 'dark'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-400" />
            <span>{t('dark')}</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ ...settings, theme: 'system' })}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition ${
              settings.theme === 'system'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>{t('system')}</span>
          </button>
        </div>
      </div></details>

      {/* 1b. Language Configuration (Tiếng Việt / English) */}
      <details className="silver-settings-section"><summary><span className="silver-settings-icon"><DynamicIcon name="Globe" className="w-5 h-5"/></span><span className="silver-settings-name">{t('language')}</span><small>{language === 'vi' ? 'Tiếng Việt' : 'English'}</small><span aria-hidden="true">›</span></summary><div className="glass-card p-5 rounded-3xl border space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('language')}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('languageDesc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setLanguage('vi')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition ${
              language === 'vi'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>🇻🇳 Tiếng Việt</span>
          </button>

          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition ${
              language === 'en'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>🇬🇧 English</span>
          </button>
        </div>
      </div></details>

      {/* 2. Data backup (merged: zero-data-loss + export/import) is below */}

      {/* 3. Security (single master toggle) */}
      <h2 className="silver-settings-group">{t('securityDataGroup')}</h2><details className="silver-settings-section"><summary><span className="silver-settings-icon"><DynamicIcon name="Lock" className="w-5 h-5"/></span><span className="silver-settings-name">{t('appSecurity')}</span><span aria-hidden="true">›</span></summary><div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t('appSecurity')}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                  settings.securityEnabled
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                }`}>
                  {settings.securityEnabled ? t('statusEnabled') : t('statusNotEnabled')}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{t('securityMasterDesc')}</p>
            </div>
          </div>

          {/* Master on/off switch */}
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={settings.securityEnabled}
              onChange={e => onUpdateSettings({
                ...settings,
                securityEnabled: e.target.checked,
                biometricEnabled: e.target.checked ? settings.biometricEnabled : false,
              })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Unlock method — only when security is on */}
        {settings.securityEnabled && (
          <div className="space-y-3 pt-1 animate-fade-in">
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, biometricEnabled: false })}
                className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border text-left transition ${
                  !settings.biometricEnabled
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Lock className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">{t('pinOnlyLabel')}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{t('pinOnlyDesc')}</span>
                  </div>
                </div>
                <span className={`w-4 h-4 rounded-full border-2 shrink-0 ${!settings.biometricEnabled ? 'border-emerald-500 bg-emerald-500' : 'border-slate-400 dark:border-slate-600'}`} />
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, biometricEnabled: true })}
                className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border text-left transition ${
                  settings.biometricEnabled
                    ? 'bg-purple-500/10 border-purple-500/40'
                    : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Fingerprint className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">{t('pinBiometricLabel')}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{t('pinBiometricDesc')}</span>
                  </div>
                </div>
                <span className={`w-4 h-4 rounded-full border-2 shrink-0 ${settings.biometricEnabled ? 'border-purple-500 bg-purple-500' : 'border-slate-400 dark:border-slate-600'}`} />
              </button>
            </div>

            {/* Change PIN row */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <KeyRound className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">{t('currentPin')}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{t('pinDigits', { count: settings.pinCode?.length || 4 })}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setPinError('');
                  setPinSuccess('');
                  setNewPin('');
                  setConfirmPin('');
                  setIsPinModalOpen(true);
                }}
                className="shrink-0 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 rounded-xl transition"
              >
                {t('changePin')}
              </button>
            </div>

            <button
              onClick={onLockAppNow}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{t('lockNowShort')}</span>
            </button>
          </div>
        )}
      </div></details>

      {/* 4.5. AI & Cloud Sync Configuration */}
      <details className="silver-settings-section"><summary><span className="silver-settings-icon"><DynamicIcon name="Sparkles" className="w-5 h-5"/></span><span className="silver-settings-name">{t('aiConfigTitle')}</span><span aria-hidden="true">›</span></summary><div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('aiConfigTitle')}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('aiConfigDesc')}</p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{t('aiModeLabel') || 'Chế độ AI'}:</span>{' '}
              {settings.geminiApiKey && settings.geminiApiKey.trim() ? (
                <span className="text-emerald-600 dark:text-emerald-400">{t('aiModeGemini') || 'Google Gemini (ưu tiên)'}</span>
              ) : (
                <span className="text-slate-500">{t('aiModeLocal') || 'AI cục bộ (offline)'}</span>
              )}
            </div>
            {settings.geminiApiKey && settings.geminiApiKey.trim() && (
              <button
                onClick={() => onUpdateSettings({ ...settings, geminiApiKey: '' })}
                className="text-[11px] text-rose-500 hover:text-rose-600"
              >
                {t('disableGemini') || 'Tắt Gemini'}
              </button>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {t('geminiKeyLabel')}
            </label>
            <input
              type="password"
              placeholder={t('geminiKeyPlaceholder')}
              value={settings.geminiApiKey || ''}
              onChange={(e) => onUpdateSettings({ ...settings, geminiApiKey: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {t('geminiKeyHint')}
              </p>
              {settings.geminiApiKey && settings.geminiApiKey.trim() && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{t('geminiKeyApplied') || 'Đã áp dụng'}</span>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {t('backendUrlLabel')}
            </label>
            <input
              type="url"
              placeholder="https://your-backend-api.com"
              value={settings.customServerUrl || ''}
              onChange={(e) => onUpdateSettings({ ...settings, customServerUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div></details>

      {/* Google Account & Cloud Backup */}
      <details className="silver-settings-section" open={!!googleUser}>
        <summary>
          <span className="silver-settings-icon">
            <Cloud className="w-5 h-5 text-blue-500" />
          </span>
          <span className="silver-settings-name">{t('googleAccountTitle')}</span>
          <small>{googleUser ? (googleUser.email || t('googleLinked')) : t('notLinked')}</small>
          <span aria-hidden="true">›</span>
        </summary>
        <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            {googleUser?.photoURL ? (
              <img src={googleUser.photoURL} alt="Avatar" className="w-11 h-11 rounded-full border border-slate-200 dark:border-slate-700 object-cover shadow-sm" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-500/20">
                {googleUser?.displayName ? googleUser.displayName.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {googleUser ? (googleUser.displayName || 'Tài khoản Google') : t('googleAccountTitle')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {googleUser ? (googleUser.email || '') : t('googleAccountDesc')}
              </p>
            </div>
            {googleUser && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Check className="w-3 h-3" /> {t('googleLinked')}
              </span>
            )}
          </div>

          {syncStatusMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              syncStatusMsg.isError
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{syncStatusMsg.text}</span>
            </div>
          )}

          {!googleUser ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-semibold rounded-2xl border border-slate-300 dark:border-slate-700 text-xs shadow-sm transition active:scale-98 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isSyncing ? t('syncing') : t('signInWithGoogle')}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQuickEmail(!showQuickEmail)}
                className="w-full text-center text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium py-1"
              >
                {showQuickEmail ? 'Ẩn liên kết nhanh' : 'Hoặc liên kết nhanh qua Email'}
              </button>

              {showQuickEmail && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <input
                    type="email"
                    value={quickEmailInput}
                    onChange={(e) => setQuickEmailInput(e.target.value)}
                    placeholder="Nhập email Google (vd: user@gmail.com)"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!quickEmailInput.includes('@')) {
                        setSyncStatusMsg({ text: 'Vui lòng nhập email hợp lệ', isError: true });
                        return;
                      }
                      firebaseAuthService.linkDirectAccount(quickEmailInput);
                      setSyncStatusMsg({ text: 'Đã liên kết tài khoản: ' + quickEmailInput, isError: false });
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition active:scale-95 shadow-sm"
                  >
                    Xác nhận liên kết ngay
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                <span>{t('lastCloudSync')}</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : t('neverSynced')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleCloudUpload}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-1.5 p-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium rounded-xl border border-blue-200 dark:border-blue-800 text-xs transition active:scale-95 disabled:opacity-50"
                >
                  <CloudUpload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{t('syncToCloud')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloudDownload}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-1.5 p-3 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium rounded-xl border border-purple-200 dark:border-purple-800 text-xs transition active:scale-95 disabled:opacity-50"
                >
                  <CloudDownload className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>{t('syncFromCloud')}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignOut}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold rounded-xl transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('signOutGoogle')}</span>
              </button>
            </div>
          )}
        </div>
      </details>

      {/* Personal Financial Profile */}
      <details className="silver-settings-section">
        <summary>
          <span className="silver-settings-icon">
            <Target className="w-5 h-5 text-indigo-500" />
          </span>
          <span className="silver-settings-name">{t('userProfileTitle')}</span>
          <small>{settings.userProfile?.financialGoal || 'Mục tiêu tài chính'}</small>
          <span aria-hidden="true">›</span>
        </summary>
        <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('userProfileTitle')}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('userProfileDesc')}</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('monthlyAllowanceLabel')}
                </label>
                <input
                  type="number"
                  value={profileAllowance}
                  onChange={(e) => setProfileAllowance(e.target.value)}
                  placeholder="Vd: 5000000"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('incomeDayLabel')}
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={profileIncomeDay}
                  onChange={(e) => setProfileIncomeDay(e.target.value)}
                  placeholder="Vd: 5"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {t('partTimeIncomeLabel')}
              </label>
              <input
                type="number"
                value={profilePartTime}
                onChange={(e) => setProfilePartTime(e.target.value)}
                placeholder="Vd: 2000000"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('financialGoalLabel')}
                </label>
                <input
                  type="text"
                  value={profileGoal}
                  onChange={(e) => setProfileGoal(e.target.value)}
                  placeholder="Vd: Quỹ khẩn cấp 3 tháng, Mua laptop..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('targetGoalAmountLabel')}
                </label>
                <input
                  type="number"
                  value={profileGoalAmount}
                  onChange={(e) => setProfileGoalAmount(e.target.value)}
                  placeholder="Vd: 15000000"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {profileSavedMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>{t('profileSaved')}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveProfile}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition active:scale-95 shadow-sm"
            >
              {t('saveProfile')}
            </button>
          </div>
        </div>
      </details>

      {/* 5. Backup and Restore */}
      <details className="silver-settings-section"><summary><span className="silver-settings-icon"><DynamicIcon name="ArchiveRestore" className="w-5 h-5"/></span><span className="silver-settings-name">{t('dataBackupTitle')}</span><span aria-hidden="true">›</span></summary><div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('dataBackupTitle')}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('dataBackupDesc')}</p>
          </div>
        </div>

        {importMessage && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            importMessage.isError
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{importMessage.text}</span>
          </div>
        )}

        {/* Zero-data-loss note */}
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2 text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{t('backupProtectedNote')}</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onExportBackup}
            className="flex items-center justify-center gap-1.5 p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-medium rounded-xl border border-slate-200 dark:border-slate-800 text-xs transition active:scale-95"
          >
            <FileDown className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>{t('exportJsonBackup')}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-medium rounded-xl border border-slate-200 dark:border-slate-800 text-xs transition active:scale-95"
          >
            <FileUp className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span>{t('importRestore')}</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>

        {/* Snapshot controls */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleRequestPersistence}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              isPersisted
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>{isPersisted ? t('persistentEnabled') : t('enablePersistent')}</span>
          </button>

          <button
            type="button"
            onClick={handleCreateSnapshot}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>{t('createSnapshotNow')}</span>
          </button>

          {snapshots.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSnapshots(!showSnapshots)}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-2"
            >
              {showSnapshots ? t('hideSnapshots') : t('viewAutoSnapshots', { count: snapshots.length })}
            </button>
          )}
        </div>

        {/* Snapshots list */}
        {showSnapshots && (
          <div className="space-y-1.5 pt-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold block">{t('recentSnapshots')}</span>
            {snapshots.map((s, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-semibold text-slate-900 dark:text-white block truncate">{s.reason}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(s.timestamp).toLocaleString()}</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (await confirmAction(t('restoreSnapshotConfirm'), {destructive:false})) {
                      storage.importBackup(JSON.stringify({ data: s.data }));
                      window.location.reload();
                    }
                  }}
                  className="shrink-0 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-emerald-700 dark:text-emerald-300 hover:text-white rounded-lg text-[11px] font-medium transition"
                >
                  {t('restore')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div></details>

      {/* 6. Audit Log */}
      <details className="silver-settings-section"><summary><span className="silver-settings-icon"><DynamicIcon name="History" className="w-5 h-5"/></span><span className="silver-settings-name">{t('auditLogTitle')}</span><span aria-hidden="true">›</span></summary><div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('auditLogTitle')}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('auditLogDesc')}</p>
            </div>
          </div>

          <button
            onClick={() => setShowAuditLogs(!showAuditLogs)}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            {showAuditLogs ? t('hide') : t('viewCount', { count: auditLogs.length })}
          </button>
        </div>

        {showAuditLogs && (
          <div className="max-h-60 overflow-y-auto space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 pr-1 text-xs">
            {auditLogs.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-center py-4">{t('noAuditLogs')}</p>
            ) : (
              auditLogs.map(log => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                      log.action === 'CREATE' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                      log.action === 'UPDATE' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                      log.action === 'DELETE' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                    }`}>
                      {log.action}
                    </span>
                    <span className="text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-xs">{log.summary}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div></details>

      {/* 7. Reset Data */}
      <details className="silver-settings-section"><summary><span className="silver-settings-icon"><DynamicIcon name="RotateCcw" className="w-5 h-5"/></span><span className="silver-settings-name">{t('restoreSampleData')}</span><span aria-hidden="true">›</span></summary><div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t('restoreSampleData')}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('restoreSampleDesc')}</p>
        </div>
        <button
          onClick={async () => {
            if (await confirmAction(t('resetConfirm'), {destructive:true})) {
              onResetData();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white rounded-xl text-xs font-semibold transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t('resetBtn')}</span>
        </button>
      </div></details>

      {/* 8. Author, Copyright & Contact Information (Designed by LocTM) */}
      <details className="silver-settings-section"><summary><span className="silver-settings-icon"><DynamicIcon name="Info" className="w-5 h-5"/></span><span className="silver-settings-name">{t('authorCopyright')}</span><span aria-hidden="true">›</span></summary><div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800/80 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Designed by LocTM</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('authorCopyright')}</p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{t('copyrightLabel')}</span>
            <span className="font-semibold text-slate-900 dark:text-white">© 2026 LTMsav. All rights reserved.</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{t('authorLabel')}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">LocTM</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{t('versionLabel')}</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white">{APP_VERSION}</span>
              <button
                type="button"
                onClick={handleCheckOta}
                disabled={isCheckingOta}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold transition flex items-center gap-1 disabled:opacity-50"
              >
                <ArrowDownToLine className="w-3 h-3" />
                <span>{isCheckingOta ? 'Đang kiểm tra...' : 'OTA Check'}</span>
              </button>
            </div>
          </div>
          {otaStatus && (
            <div className="text-[10px] p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
              {otaStatus}
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-400">{t('contactAuthorLabel')}</span>
            <a
              href="mailto:tranlocbtr99@gmail.com"
              className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>tranlocbtr99@gmail.com</span>
            </a>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { setSupportCopied(false); setIsSupportOpen(true); }}
          className="mt-1 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 hover:brightness-110 text-white text-xs font-bold shadow-md shadow-rose-900/20 transition active:scale-95"
        >
          <Heart className="w-4 h-4" />
          <span>{t('supportAuthor')}</span>
        </button>
      </div></details>

      {/* Support Author Modal */}
      {isSupportOpen && (
        <AssetSheet title={t('supportAuthor')} onClose={() => setIsSupportOpen(false)}>
          <div className="silver-asset-panel">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>{t('supportAuthor')}</span>
              </h3>
              <button onClick={() => setIsSupportOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="silver-asset-fields"><p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('supportDesc')}
            </p>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 block">{t('bankName')}</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-xs">Techcombank</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 block">{t('accountHolder')}</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-xs">Tran Minh Loc</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="min-w-0">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">{t('accountNumber')}</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm tabular-nums">4444444790</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText('4444444790');
                    setSupportCopied(true);
                    setTimeout(() => setSupportCopied(false), 1800);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition active:scale-95 shrink-0"
                >
                  {supportCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{supportCopied ? t('copied') : t('copy')}</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">{t('supportThanks')}</p>
          </div></div>
        </AssetSheet>
      )}

      {/* Change PIN Modal */}
      {isPinModalOpen && (
        <AssetSheet title={t('changePinTitle')} onClose={() => setIsPinModalOpen(false)}>
          <div className="silver-asset-panel">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>{t('changePinTitle')}</span>
              </h3>
              <button onClick={() => setIsPinModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePin} className="space-y-3.5"><div className="silver-asset-fields">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mb-1">{t('newPinLabel')}</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-base font-bold text-center tracking-widest focus:outline-none focus:border-emerald-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mb-1">{t('confirmNewPinLabel')}</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-base font-bold text-center tracking-widest focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {pinError && (
                <p className="text-xs text-rose-500 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{pinError}</span>
                </p>
              )}

              {pinSuccess && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{pinSuccess}</span>
                </p>
              )}

              </div><div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-semibold text-xs rounded-lg hover:bg-blue-700 shadow-md"
                >
                  {t('savePin')}
                </button>
              </div>
            </form>
          </div>
        </AssetSheet>
      )}

    </div>
  );
};
