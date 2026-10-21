import React, { useState, useRef, useEffect } from 'react';
import { AppSettings, AuditLog } from '../types';
import { 
  Lock, Fingerprint, KeyRound, HardDrive, RotateCcw, Shield, Check, 
  AlertCircle, History, FileDown, FileUp, Mail, User, 
  Sun, Moon, Monitor, Database, ShieldCheck, RefreshCw, Sparkles, Globe,
  Heart, Copy, X
} from 'lucide-react';
import { storage } from '../services/storage';
import { useLanguage } from '../contexts/LanguageContext';

const APP_VERSION = '1.5.9';

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
    <div className="space-y-4 pb-12">
      
      {/* 1. Theme Configuration (Giao diện Sáng / Tối) */}
      <div className="glass-card p-5 rounded-3xl border space-y-3.5">
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
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>{t('system')}</span>
          </button>
        </div>
      </div>

      {/* 1b. Language Configuration (Tiếng Việt / English) */}
      <div className="glass-card p-5 rounded-3xl border space-y-3.5">
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
                ? 'bg-emerald-600 text-white shadow-sm'
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
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>🇬🇧 English</span>
          </button>
        </div>
      </div>

      {/* 2. Data backup (merged: zero-data-loss + export/import) is below */}

      {/* 3. Security (single master toggle) */}
      <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
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
            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
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
      </div>

      {/* 4.5. AI & Cloud Sync Configuration */}
      <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
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
      </div>

      {/* 5. Backup and Restore */}
      <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3.5">
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
                  onClick={() => {
                    if (confirm(t('restoreSnapshotConfirm'))) {
                      storage.importBackup(JSON.stringify({ data: s.data }));
                      window.location.reload();
                    }
                  }}
                  className="shrink-0 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white rounded-lg text-[11px] font-medium transition"
                >
                  {t('restore')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Audit Log */}
      <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
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
      </div>

      {/* 7. Reset Data */}
      <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t('restoreSampleData')}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('restoreSampleDesc')}</p>
        </div>
        <button
          onClick={() => {
            if (confirm(t('resetConfirm'))) {
              onResetData();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white rounded-xl text-xs font-semibold transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t('resetBtn')}</span>
        </button>
      </div>

      {/* 8. Author, Copyright & Contact Information (Designed by LocTM) */}
      <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800/80 space-y-3">
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
            <span className="font-semibold text-slate-900 dark:text-white">{APP_VERSION}</span>
          </div>
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
      </div>

      {/* Support Author Modal */}
      {isSupportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-pop-in max-h-[88dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>{t('supportAuthor')}</span>
              </h3>
              <button onClick={() => setIsSupportOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
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
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition active:scale-95 shrink-0"
                >
                  {supportCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{supportCopied ? t('copied') : t('copy')}</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">{t('supportThanks')}</p>
          </div>
        </div>
      )}

      {/* Change PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[88dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>{t('changePinTitle')}</span>
              </h3>
              <button onClick={() => setIsPinModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePin} className="space-y-3.5">
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

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-500 shadow-md"
                >
                  {t('savePin')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
