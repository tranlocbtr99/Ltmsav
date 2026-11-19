package com.ltmsav.app;

import android.content.Intent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

@CapacitorPlugin(name = "NativeGoogleAuth")
public class NativeGoogleAuthPlugin extends Plugin {
    private GoogleSignInClient googleSignInClient;

    private GoogleSignInClient getClient() {
        if (googleSignInClient == null) {
            GoogleSignInOptions.Builder builder = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestEmail()
                    .requestProfile();

            try {
                int resId = getActivity().getResources().getIdentifier("default_web_client_id", "string", getActivity().getPackageName());
                if (resId != 0) {
                    String webClientId = getActivity().getString(resId);
                    if (webClientId != null && !webClientId.trim().isEmpty()) {
                        builder.requestIdToken(webClientId.trim());
                    }
                }
            } catch (Exception ignored) {}

            googleSignInClient = GoogleSignIn.getClient(getActivity(), builder.build());
        }
        return googleSignInClient;
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        try {
            Intent signInIntent = getClient().getSignInIntent();
            startActivityForResult(call, signInIntent, "handleSignInResult");
        } catch (Exception e) {
            call.reject("Không thể mở đăng nhập Google: " + e.getMessage());
        }
    }

    @ActivityCallback
    private void handleSignInResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        Intent data = result.getData();
        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
        try {
            GoogleSignInAccount account = task.getResult(ApiException.class);
            if (account != null) {
                JSObject ret = new JSObject();
                ret.put("id", account.getId() != null ? account.getId() : "");
                ret.put("email", account.getEmail() != null ? account.getEmail() : "");
                ret.put("displayName", account.getDisplayName() != null ? account.getDisplayName() : "");
                ret.put("photoUrl", account.getPhotoUrl() != null ? account.getPhotoUrl().toString() : "");
                ret.put("idToken", account.getIdToken() != null ? account.getIdToken() : "");
                call.resolve(ret);
                return;
            }
            call.reject("Không nhận được dữ liệu tài khoản từ Google");
        } catch (ApiException e) {
            int statusCode = e.getStatusCode();
            String reason;
            switch (statusCode) {
                case 10:
                    reason = "Lỗi 10 (DEVELOPER_ERROR): Chưa đăng ký SHA-1 trên Firebase / Google Cloud Console";
                    break;
                case 12500:
                    reason = "Lỗi 12500: Thiết bị chưa đăng nhập Google Play hoặc cấu hình OAuth sai";
                    break;
                case 7:
                    reason = "Lỗi 7: Không có kết nối mạng (Network Error)";
                    break;
                case 16:
                case 12501:
                    reason = "Đã hủy đăng nhập Google";
                    break;
                default:
                    reason = "Mã lỗi " + statusCode + ": " + (e.getMessage() != null ? e.getMessage() : "Không xác định");
                    break;
            }
            call.reject(reason, String.valueOf(statusCode));
        } catch (Exception e) {
            call.reject("Lỗi không xác định: " + e.getMessage());
        }
    }

    @PluginMethod
    public void signOut(PluginCall call) {
        try {
            getClient().signOut().addOnCompleteListener(getActivity(), task -> {
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            });
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        }
    }
}

