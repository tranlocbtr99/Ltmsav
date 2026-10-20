package com.ltmsav.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeBiometric")
public class NativeBiometricPlugin extends Plugin {
    private BiometricAuthManager biometricManager;

    @Override
    public void load() {
        biometricManager = new BiometricAuthManager(getActivity());
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        if (biometricManager == null) {
            biometricManager = new BiometricAuthManager(getActivity());
        }
        boolean available = biometricManager.isBiometricAvailable();
        JSObject ret = new JSObject();
        ret.put("isAvailable", available);
        call.resolve(ret);
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        if (biometricManager == null) {
            biometricManager = new BiometricAuthManager(getActivity());
        }

        String title = call.getString("title", "LTMsav Bảo Mật");
        String subtitle = call.getString("subtitle", "Quét vân tay hoặc khuôn mặt để mở khóa");
        String cancelTitle = call.getString("cancelTitle", "Dùng mã PIN");

        biometricManager.promptBiometric(title, subtitle, cancelTitle, new BiometricAuthManager.AuthCallback() {
            @Override
            public void onSuccess() {
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            }

            @Override
            public void onError(String error) {
                call.reject(error);
            }
        });
    }
}
