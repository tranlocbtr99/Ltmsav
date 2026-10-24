import { Capacitor, registerPlugin } from '@capacitor/core';

export interface NativeBiometricPlugin {
  isAvailable(): Promise<{ isAvailable: boolean }>;
  authenticate(options?: {
    title?: string;
    subtitle?: string;
    cancelTitle?: string;
  }): Promise<{ success: boolean }>;
}

const NativeBiometric = registerPlugin<NativeBiometricPlugin>('NativeBiometric');

export const biometricService = {
  async isAvailable(): Promise<boolean> {
    // 1. Native Android / iOS via Capacitor
    if (Capacitor.isNativePlatform()) {
      try {
        if (!Capacitor.isPluginAvailable('NativeBiometric')) {
          console.warn('NativeBiometric plugin not registered');
          return false;
        }
        const result = await NativeBiometric.isAvailable();
        return !!result?.isAvailable;
      } catch (err) {
        console.warn('Native biometric availability check failed:', err);
        return false;
      }
    }

    // Web enrollment requires a credential bound to this app/user. Until implemented,
    // use the existing PIN instead of accepting arbitrary/new WebAuthn credentials.
    return false;
  },

  async authenticate(title = 'LTMsav Bảo Mật', subtitle = 'Quét vân tay hoặc khuôn mặt để mở khóa'): Promise<boolean> {
    // 1. Native Android BiometricPrompt via Capacitor
    if (Capacitor.isNativePlatform()) {
      try {
        if (!Capacitor.isPluginAvailable('NativeBiometric')) {
          console.warn('NativeBiometric plugin not registered');
          return false;
        }
        const res = await NativeBiometric.authenticate({
          title,
          subtitle,
          cancelTitle: 'Dùng mã PIN',
        });
        return !!res?.success;
      } catch (err) {
        console.warn('Native biometric authentication failed or cancelled:', err);
        return false;
      }
    }

    return false;
  },
};
