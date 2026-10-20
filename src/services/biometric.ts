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

    // 2. Web browser WebAuthn platform authenticator
    if (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
    ) {
      try {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      } catch (e) {
        return false;
      }
    }

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

    // 2. Web browser fallback with WebAuthn
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const credential = await navigator.credentials.get({
          publicKey: {
            challenge,
            timeout: 60000,
            userVerification: 'preferred',
            rpId: window.location.hostname || 'localhost',
          },
        }).catch(async () => {
          const userId = new Uint8Array(16);
          window.crypto.getRandomValues(userId);
          return await navigator.credentials.create({
            publicKey: {
              challenge,
              rp: { name: 'FinFlow App', id: window.location.hostname || 'localhost' },
              user: { id: userId, name: 'finflow_user', displayName: 'FinFlow User' },
              pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
              authenticatorSelection: {
                authenticatorAttachment: 'platform',
                userVerification: 'required',
              },
              timeout: 60000,
            },
          });
        });

        return !!credential;
      } catch (e) {
        console.warn('WebAuthn failed:', e);
        return false;
      }
    }

    return false;
  },
};
