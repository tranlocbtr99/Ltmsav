import React, { useState } from 'react';
import { AppUpdateInfo } from '../services/updateManager';
import { ArrowDownToLine, Sparkles, X, ExternalLink } from 'lucide-react';

interface AppUpdateBannerProps {
  updateInfo: AppUpdateInfo | null;
}

export const AppUpdateBanner: React.FC<AppUpdateBannerProps> = ({ updateInfo }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!updateInfo || !updateInfo.isUpdateAvailable || isDismissed) {
    return null;
  }

  const handleDownload = () => {
    if (updateInfo.downloadUrl) {
      window.open(updateInfo.downloadUrl, '_blank');
    }
  };

  return (
    <div className="mx-auto max-w-3xl mb-3">
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 text-xs flex items-center justify-between gap-3 animate-fade-in">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md shrink-0">
            <ArrowDownToLine className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-bold flex items-center gap-1.5 truncate">
              <span>Đã có phiên bản mới v{updateInfo.latestVersion}</span>
              <span className="text-[10px] bg-white/25 px-1.5 py-0.2 rounded-full font-medium">OTA</span>
            </div>
            <p className="text-[11px] text-blue-100 truncate mt-0.5">
              {updateInfo.releaseNotes.split('\n')[0] || 'Cải tiến hiệu năng & tính năng mới'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl text-xs transition active:scale-95 shadow-sm flex items-center gap-1"
          >
            <span>Cập nhật ngay</span>
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-full text-white/70 hover:text-white"
            title="Bỏ qua"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

