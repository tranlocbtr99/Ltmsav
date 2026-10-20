package com.ltmsav.app;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;
import java.util.concurrent.Executor;

public class BiometricAuthManager {
    private final FragmentActivity activity;

    public interface AuthCallback {
        void onSuccess();
        void onError(String error);
    }

    public BiometricAuthManager(FragmentActivity activity) {
        this.activity = activity;
    }

    public boolean isBiometricAvailable() {
        if (activity == null) return false;
        try {
            BiometricManager biometricManager = BiometricManager.from(activity);
            int canAuth = biometricManager.canAuthenticate(
                BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK
            );
            return canAuth == BiometricManager.BIOMETRIC_SUCCESS;
        } catch (Exception e) {
            return false;
        }
    }

    public void promptBiometric(String title, String subtitle, String negativeButtonText, AuthCallback callback) {
        if (activity == null) {
            if (callback != null) callback.onError("Activity not available");
            return;
        }

        activity.runOnUiThread(() -> {
            try {
                Executor executor = ContextCompat.getMainExecutor(activity);
                BiometricPrompt prompt = new BiometricPrompt(activity, executor, new BiometricPrompt.AuthenticationCallback() {
                    @Override
                    public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                        super.onAuthenticationSucceeded(result);
                        if (callback != null) callback.onSuccess();
                    }

                    @Override
                    public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                        super.onAuthenticationError(errorCode, errString);
                        if (callback != null) callback.onError(errString.toString());
                    }

                    @Override
                    public void onAuthenticationFailed() {
                        super.onAuthenticationFailed();
                    }
                });

                BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                    .setTitle(title != null && !title.isEmpty() ? title : "Xác thực sinh trắc học")
                    .setSubtitle(subtitle != null && !subtitle.isEmpty() ? subtitle : "Quét vân tay hoặc khuôn mặt để mở khóa")
                    .setNegativeButtonText(negativeButtonText != null && !negativeButtonText.isEmpty() ? negativeButtonText : "Dùng mã PIN")
                    .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK)
                    .build();

                prompt.authenticate(promptInfo);
            } catch (Exception e) {
                if (callback != null) callback.onError(e.getMessage());
            }
        });
    }
}
