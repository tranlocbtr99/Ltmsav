import React, { useState, useRef, useEffect } from 'react';
import { AppSettings, AuditLog } from '../types';
import { 
  Lock, Fingerprint, KeyRound, HardDrive, RotateCcw, Shield, Check, 
  AlertCircle, History, FileDown, FileUp, Mail, User, Info, Smartphone, 
  Sun, Moon, Monitor, Database, ShieldCheck, RefreshCw 
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWA';
import { storage } from '../services/storage';

interface SettingsTabProps {
  settings: AppSettings;
  auditLogs: AuditLog[];
  onUpdateSettings: (settings: AppSettings) => void;
  onExportBackup: () => void;
  onImportBackup: (json: string) => { success: boolean; message: string };
  onResetData: () => void;
  onLockAppNow: () => void;
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
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [importMessage, setImportMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isPersisted, setIsPersisted] = useState(false);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setImportMessage({ text: 'Bộ nhớ trình duyệt đã được khóa bảo vệ vĩnh viễn (Persistent)!', isError: false });
    } else {
      setImportMessage({ text: 'Trình duyệt chưa cấp quyền lưu trữ vĩnh viễn.', isError: true });
    }
    setTimeout(() => setImportMessage(null), 4000);
  };

  const handleCreateSnapshot = () => {
    storage.createAutomaticSnapshot('Sao lưu an toàn thủ công từ Cài đặt');
    setSnapshots(storage.getAutoSnapshots());
    setImportMessage({ text: 'Đã tạo bản sao lưu an toàn tức thời!', isError: false });
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
      setPinError('Mã PIN phải từ 4 đến 6 chữ số');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('Mã PIN xác nhận không khớp');
      return;
    }

    onUpdateSettings({
      ...settings,
      pinCode: newPin,
      securityEnabled: true,
    });

    setPinSuccess('Đã đổi mã PIN thành công!');
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
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Giao Diện Ứng Dụng</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Tùy chỉnh chế độ Sáng / Tối theo sở thích</p>
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
            <span>Sáng</span>
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
            <span>Tối</span>
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
            <span>Hệ thống</span>
          </button>
        </div>
      </div>

      {/* 2. Zero-Data-Loss Protection & Migration Engine */}
      <div className="glass-panel p-5 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Bảo Vệ Dữ Liệu Khi Nâng Cấp & Cài Đặt Mới</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">
                Chống Mất Dữ Liệu
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Công nghệ Schema Versioning & Persistent Storage</p>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
          <p className="leading-relaxed text-[11px]">
            🛡️ <strong>LTMsav bảo toàn 100% dữ liệu của bạn như thế nào?</strong>
          </p>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
            <li><strong>Bộ chuyển đổi phiên bản (Data Migration Engine):</strong> Khi có tính năng mới hoặc gói cập nhật, LTMsav tự động nâng cấp cấu trúc và kế thừa toàn bộ sổ giao dịch cũ, không ghi đè dữ liệu người dùng.</li>
            <li><strong>Lưu trữ vĩnh viễn (Persistent Storage):</strong> Đăng ký với hệ điều hành điện thoại để không bị dọn rác bộ nhớ.</li>
            <li><strong>Bản chụp an toàn tự động (Auto Snapshots):</strong> Tự động sao lưu một bản dự phòng trước mỗi lần nâng cấp.</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={handleRequestPersistence}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              isPersisted
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isPersisted ? '✓ Đã kích hoạt lưu vĩnh viễn' : 'Kích hoạt Persistent Storage'}</span>
          </button>

          <button
            type="button"
            onClick={handleCreateSnapshot}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>Tạo bản chụp dự phòng ngay</span>
          </button>

          {snapshots.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSnapshots(!showSnapshots)}
              className="text-xs font-semibold text-emerald-400 hover:underline px-2 py-2"
            >
              {showSnapshots ? 'Ẩn bản chụp' : `Xem bản chụp tự động (${snapshots.length})`}
            </button>
          )}
        </div>

        {/* Snapshots list */}
        {showSnapshots && (
          <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold block">Các bản chụp dữ liệu an toàn gần nhất:</span>
            {snapshots.map((s, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">{s.reason}</span>
                  <span className="text-[10px] text-slate-500">{new Date(s.timestamp).toLocaleString()}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Khôi phục lại dữ liệu từ bản chụp này?')) {
                      storage.importBackup(JSON.stringify({ data: s.data }));
                      window.location.reload();
                    }
                  }}
                  className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-[11px] font-medium"
                >
                  Khôi phục
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Security & Biometrics Card */}
      <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Bảo Mật Ứng Dụng</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  settings.securityEnabled
                    ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                }`}>
                  {settings.securityEnabled ? 'Đang bật' : 'Chưa bật'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Đăng nhập bằng Mật khẩu PIN, Vân tay & Khuôn mặt</p>
            </div>
          </div>

          {settings.securityEnabled && (
            <button
              onClick={onLockAppNow}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition"
            >
              Khóa ngay
            </button>
          )}
        </div>

        {/* Security Options */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Khóa ứng dụng bằng mã PIN</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Yêu cầu xác thực khi mở ứng dụng</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.securityEnabled}
                onChange={e => onUpdateSettings({ ...settings, securityEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <Fingerprint className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Vân tay & Khuôn mặt (Biometrics)</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Tích hợp cảm biến vân tay / Face ID trên điện thoại</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.biometricEnabled}
                onChange={e => onUpdateSettings({ ...settings, biometricEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Mã PIN bảo mật hiện tại</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Mã PIN: •••• ({settings.pinCode?.length || 4} chữ số)</span>
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
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 rounded-xl transition"
            >
              Đổi mã PIN
            </button>
          </div>
        </div>
      </div>

      {/* 4. PWA Home Screen Installation */}
      <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cài Đặt LTMsav Vào Điện Thoại</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Sử dụng mượt mà không chiếm dung lượng bộ nhớ</p>
            </div>
          </div>
        </div>

        {isInstallable ? (
          <button
            onClick={install}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-blue-950/20 transition active:scale-95"
          >
            <Smartphone className="w-4 h-4" />
            <span>Thêm LTMsav Vào Màn Hình Chính</span>
          </button>
        ) : isIOS ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl text-xs sm:text-sm transition"
          >
            <Smartphone className="w-4 h-4" />
            <span>Hướng dẫn cài đặt trên iOS Safari</span>
          </button>
        ) : isInstalled ? (
          <div className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium rounded-2xl text-xs sm:text-sm border border-emerald-500/20">
            <Check className="w-4 h-4" />
            <span>Đã cài đặt LTMsav trên màn hình chính</span>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Bạn có thể nhấn menu trình duyệt và chọn "Thêm vào màn hình chính" bất kỳ lúc nào.</span>
          </div>
        )}
      </div>

      {/* 5. Backup and Restore */}
      <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Dữ Liệu & Sao Lưu</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Xuất file JSON an toàn hoặc khôi phục dữ liệu</p>
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

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onExportBackup}
            className="flex items-center justify-center gap-1.5 p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-medium rounded-xl border border-slate-200 dark:border-slate-800 text-xs transition active:scale-95"
          >
            <FileDown className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Xuất sao lưu JSON</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-medium rounded-xl border border-slate-200 dark:border-slate-800 text-xs transition active:scale-95"
          >
            <FileUp className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span>Nhập khôi phục</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {/* 6. Audit Log */}
      <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Nhật Ký Kiểm Toán</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Lịch sử sửa đổi & đảo bút toán giao dịch</p>
            </div>
          </div>

          <button
            onClick={() => setShowAuditLogs(!showAuditLogs)}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            {showAuditLogs ? 'Ẩn' : `Xem (${auditLogs.length})`}
          </button>
        </div>

        {showAuditLogs && (
          <div className="max-h-60 overflow-y-auto space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 pr-1 text-xs">
            {auditLogs.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-center py-4">Chưa có bản ghi kiểm toán nào.</p>
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
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Khôi phục dữ liệu mẫu</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Xóa dữ liệu hiện tại và tải lại tài khoản mẫu</p>
        </div>
        <button
          onClick={() => {
            if (confirm('Bạn có chắc chắn muốn đặt lại dữ liệu về mặc định ban đầu không? (Ứng dụng đã tự động lưu bản chụp để khôi phục nếu cần)')) {
              onResetData();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white rounded-xl text-xs font-semibold transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Đặt lại</span>
        </button>
      </div>

      {/* 8. Author, Copyright & Contact Information (Designed by LocTM) */}
      <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800/80 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">designed by LocTM</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Tác giả & Bản quyền phần mềm</p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Bản quyền:</span>
            <span className="font-semibold text-slate-900 dark:text-white">© 2026 LTMsav. All rights reserved.</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Tác giả:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">LocTM</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-400">Liên hệ tác giả:</span>
            <a
              href="mailto:tranlocbtr99@gmail.com"
              className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>tranlocbtr99@gmail.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* Change PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Đổi Mã PIN Bảo Mật</span>
              </h3>
              <button onClick={() => setIsPinModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePin} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mb-1">Mã PIN mới (4 - 6 số)</label>
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
                <label className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mb-1">Xác nhận mã PIN mới</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
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
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-500 shadow-md"
                >
                  Lưu mã PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl text-center space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Cài đặt trên iPhone / iPad</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 text-left leading-relaxed">
              1. Nhấn vào biểu tượng <strong>Chia sẻ (Share)</strong> ở thanh dưới Safari.<br />
              2. Kéo xuống và chọn <strong>Thêm vào Màn hình chính (Add to Home Screen)</strong>.<br />
              3. Chọn <strong>Thêm</strong> để hoàn tất.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-xl bg-slate-200 dark:bg-slate-800 py-2.5 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
