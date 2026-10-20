import React, { useState, useEffect } from 'react';
import { Fingerprint, Lock, ShieldCheck, Delete, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
import { biometricService } from '../services/biometric';

interface SecurityLockScreenProps {
  correctPin: string;
  biometricEnabled: boolean;
  onUnlock: () => void;
}

export const SecurityLockScreen: React.FC<SecurityLockScreenProps> = ({
  correctPin,
  biometricEnabled,
  onUnlock,
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Check if phone platform authenticator (fingerprint/face id) is supported
  useEffect(() => {
    let isMounted = true;
    async function checkBiometrics() {
      const available = await biometricService.isAvailable();
      if (isMounted) {
        setBiometricAvailable(available);
        if (available && biometricEnabled) {
          triggerBiometricAuth();
        }
      }
    }
    checkBiometrics();
    return () => {
      isMounted = false;
    };
  }, [biometricEnabled]);

  // Biometric Trigger (Native Android Fingerprint / Face ID / WebAuthn)
  const triggerBiometricAuth = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setErrorMessage('');

    try {
      const success = await biometricService.authenticate(
        'FinFlow Bảo Mật',
        'Quét vân tay hoặc khuôn mặt để mở khóa ứng dụng'
      );
      if (success) {
        onUnlock();
      } else {
        setErrorMessage('Không nhận diện được sinh trắc học. Vui lòng nhập mã PIN.');
      }
    } catch (err: any) {
      setErrorMessage('Xác thực thất bại. Vui lòng nhập mã PIN.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleKeyPress = (num: string) => {
    if (enteredPin.length < 6) {
      const nextPin = enteredPin + num;
      setEnteredPin(nextPin);
      setErrorMessage('');

      // Auto check when length reaches correctPin length
      if (nextPin.length === correctPin.length) {
        if (nextPin === correctPin) {
          onUnlock();
        } else {
          setIsShaking(true);
          setErrorMessage('Mã PIN không đúng, vui lòng thử lại!');
          setTimeout(() => {
            setEnteredPin('');
            setIsShaking(false);
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setErrorMessage('');
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enteredPin, correctPin]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white select-none backdrop-blur-xl">
      
      {/* Top Branding */}
      <div className="pt-8 flex flex-col items-center space-y-3">
        <div className="relative">
          <img src="/icon.svg" alt="LTMsav" className="w-20 h-20 rounded-3xl shadow-2xl shadow-emerald-950 border border-emerald-500/30" />
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-slate-900 border border-emerald-500/40 text-emerald-400">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            <span>LTM</span>
            <span className="text-emerald-400">sav</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Designed by LocTM</p>
        </div>
      </div>

      {/* Middle: PIN Prompt & Indicators */}
      <div className="w-full max-w-xs flex flex-col items-center space-y-5">
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-200">
            Nhập mã PIN hoặc xác thực vân tay / khuôn mặt
          </p>
          {errorMessage ? (
            <p className="text-xs text-rose-400 mt-1 flex items-center justify-center gap-1 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5" />
              {errorMessage}
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 mt-1">Nhập mã PIN để mở khóa ứng dụng</p>
          )}
        </div>

        {/* PIN Dots */}
        <div className={`flex items-center gap-4 py-2 ${isShaking ? 'animate-bounce text-rose-400' : ''}`}>
          {Array.from({ length: correctPin.length || 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                i < enteredPin.length
                  ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-lg shadow-emerald-500/50'
                  : 'bg-transparent border-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Biometrics Action Button */}
        <button
          type="button"
          onClick={triggerBiometricAuth}
          disabled={isAuthenticating}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-emerald-500/20 shadow-md transition active:scale-95"
        >
          <Fingerprint className="w-4 h-4 animate-pulse" />
          <span>{isAuthenticating ? 'Đang quét sinh trắc học...' : 'Mở khóa bằng Vân tay / Face ID'}</span>
        </button>
      </div>

      {/* Numerical Keypad */}
      <div className="w-full max-w-xs pb-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num.toString())}
              className="h-16 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:bg-slate-800 active:scale-95 text-xl font-bold text-white shadow-sm flex items-center justify-center transition"
            >
              {num}
            </button>
          ))}

          {/* Biometrics Shortcut Button on Keypad */}
          <button
            type="button"
            onClick={triggerBiometricAuth}
            className="h-16 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:bg-slate-800 active:scale-95 text-emerald-400 flex flex-col items-center justify-center transition"
            title="Quét vân tay / Face ID"
          >
            <Fingerprint className="w-6 h-6" />
            <span className="text-[9px] font-semibold mt-0.5">Vân tay</span>
          </button>

          {/* 0 */}
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:bg-slate-800 active:scale-95 text-xl font-bold text-white shadow-sm flex items-center justify-center transition"
          >
            0
          </button>

          {/* Backspace */}
          <button
            type="button"
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-white flex items-center justify-center transition"
            title="Xóa ký tự"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>

    </div>
  );
};
