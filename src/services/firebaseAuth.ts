import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  getRedirectResult,
  signOut as fbSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { storage } from './storage';

interface NativeGoogleAuthPluginInterface {
  signIn(): Promise<{ id: string; email: string; displayName: string; photoUrl: string; idToken: string }>;
  signOut(): Promise<{ success: boolean }>;
}

const NativeGoogleAuth = registerPlugin<NativeGoogleAuthPluginInterface>('NativeGoogleAuth');

// Configuration loaded from google-services.json for LTMsav
export const firebaseConfig = {
  apiKey: "AIzaSyCyMhqXbdwRzuIe1hDdlzoinxZ5Ysz60Io",
  authDomain: "ltmsav.firebaseapp.com",
  projectId: "ltmsav",
  storageBucket: "ltmsav.firebasestorage.app",
  messagingSenderId: "894474413931",
  appId: "1:894474413931:android:5061d1c2063f4e83750e2e"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export interface GoogleUserInfo {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface CloudSyncResult {
  success: boolean;
  message?: string;
  timestamp?: string;
}

class FirebaseAuthService {
  private currentUser: GoogleUserInfo | null = null;
  private listeners: ((user: GoogleUserInfo | null) => void)[] = [];

  constructor() {
    // 1. Khôi phục từ localStorage nếu đã đăng nhập trước đó
    try {
      const savedUser = localStorage.getItem('ltmsav_google_user');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      }
    } catch {
      // Ignored
    }

    // 2. Lắng nghe trạng thái Firebase Auth (Web)
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        this.currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        };
        localStorage.setItem('ltmsav_google_user', JSON.stringify(this.currentUser));
      } else if (!Capacitor.isNativePlatform()) {
        // Trên web khi logout thì clear
        if (!localStorage.getItem('ltmsav_google_user_manual')) {
          this.currentUser = null;
          localStorage.removeItem('ltmsav_google_user');
        }
      }
      this.notifyListeners();
    });

    // 3. Kiểm tra redirect kết quả nếu có
    if (!Capacitor.isNativePlatform()) {
      getRedirectResult(auth).catch((err) => {
        console.warn('Firebase redirect error:', err);
      });
    }
  }

  public getCurrentUser(): GoogleUserInfo | null {
    return this.currentUser;
  }

  public onUserChange(callback: (user: GoogleUserInfo | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.currentUser);
    }
  }

  public async signInWithGoogle(): Promise<GoogleUserInfo> {
    // 1. Chạy Native Google Sign-In nếu đang trên Android (Capacitor)
    if (Capacitor.isNativePlatform()) {
      try {
        const nativeAccount = await NativeGoogleAuth.signIn();
        const userInfo: GoogleUserInfo = {
          uid: nativeAccount.id || nativeAccount.email || 'google_user',
          email: nativeAccount.email,
          displayName: nativeAccount.displayName || 'Tài khoản Google',
          photoURL: nativeAccount.photoUrl || null
        };

        // Nếu có idToken, thử liên kết phiên với Firebase Auth
        if (nativeAccount.idToken) {
          try {
            const credential = GoogleAuthProvider.credential(nativeAccount.idToken);
            const fbResult = await signInWithCredential(auth, credential);
            if (fbResult.user) {
              userInfo.uid = fbResult.user.uid;
            }
          } catch (fbErr) {
            console.warn('Firebase Auth credential link warning:', fbErr);
          }
        }

        this.currentUser = userInfo;
        localStorage.setItem('ltmsav_google_user', JSON.stringify(userInfo));
        this.notifyListeners();
        return userInfo;
      } catch (nativeErr: any) {
        console.error('Native Google Auth failed:', nativeErr);
        throw new Error(nativeErr?.message || 'Không thể đăng nhập Google trên thiết bị');
      }
    }

    // 2. Chạy Web SDK nếu đang chạy trên Trình duyệt / PWA
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      this.currentUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      };
      localStorage.setItem('ltmsav_google_user', JSON.stringify(this.currentUser));
      this.notifyListeners();
      return this.currentUser;
    } catch (popupError: any) {
      if (
        popupError?.code === 'auth/popup-blocked' ||
        popupError?.code === 'auth/popup-closed-by-user' ||
        popupError?.code === 'auth/cancelled-popup-request'
      ) {
        await signInWithRedirect(auth, googleProvider);
        throw new Error('Chuyển hướng đăng nhập Google...');
      }
      throw popupError;
    }
  }

  /**
   * Cho phép liên kết tài khoản Google nhanh bằng Email
   */
  public linkDirectAccount(email: string, displayName?: string, photoURL?: string): GoogleUserInfo {
    const cleanEmail = email.trim();
    const cleanName = displayName?.trim() || cleanEmail.substring(0, cleanEmail.indexOf('@')) || 'Tài khoản Google';
    const userInfo: GoogleUserInfo = {
      uid: 'user_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
      email: cleanEmail,
      displayName: cleanName,
      photoURL: photoURL || null
    };
    this.currentUser = userInfo;
    localStorage.setItem('ltmsav_google_user', JSON.stringify(userInfo));
    localStorage.setItem('ltmsav_google_user_manual', 'true');
    this.notifyListeners();
    return userInfo;
  }

  public async signOut(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await NativeGoogleAuth.signOut();
      }
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    this.currentUser = null;
    localStorage.removeItem('ltmsav_google_user');
    localStorage.removeItem('ltmsav_google_user_manual');
    this.notifyListeners();
  }

  /**
   * Đồng bộ dữ liệu hiện tại từ localStorage lên Firestore
   */
  public async syncToCloud(): Promise<CloudSyncResult> {
    const user = this.currentUser;
    if (!user) {
      return { success: false, message: 'Chưa đăng nhập Google' };
    }

    try {
      const backupData = storage.exportBackup();
      const userDocRef = doc(db, 'users', user.uid, 'finance_data', 'latest');
      const now = new Date().toISOString();

      await setDoc(userDocRef, {
        payload: backupData,
        email: user.email,
        displayName: user.displayName,
        updatedAt: now
      }, { merge: true });

      localStorage.setItem('ltmsav_last_cloud_sync', now);
      return { success: true, timestamp: now };
    } catch (error: any) {
      console.error('Error syncing to cloud:', error);
      const msg = error?.message || '';
      const code = error?.code || '';
      
      let userFriendlyMsg = 'Lỗi đồng bộ: ' + (error?.message || 'Không xác định');
      if (code === 'permission-denied' || msg.includes('PERMISSION_DENIED') || msg.includes('not been used in project')) {
        userFriendlyMsg = 'Dự án ltmsav chưa kích hoạt Cloud Firestore hoặc chưa mở Rules. Hãy vào console.firebase.google.com/project/ltmsav/firestore để Tạo cơ sở dữ liệu.';
      } else if (code === 'unavailable' || msg.includes('offline')) {
        userFriendlyMsg = 'Không thể kết nối máy chủ Firebase (Cloud Firestore chưa được tạo trên Firebase Console hoặc thiết bị mất mạng).';
      }
      return { success: false, message: userFriendlyMsg };
    }
  }

  /**
   * Kéo dữ liệu từ Firestore về và khôi phục vào ứng dụng
   */
  public async syncFromCloud(): Promise<CloudSyncResult> {
    const user = this.currentUser;
    if (!user) {
      return { success: false, message: 'Chưa đăng nhập Google' };
    }

    try {
      const userDocRef = doc(db, 'users', user.uid, 'finance_data', 'latest');
      const snapshot = await getDoc(userDocRef);

      if (!snapshot.exists()) {
        return { success: false, message: 'Chưa có bản sao lưu nào trên đám mây' };
      }

      const data = snapshot.data();
      if (!data || !data.payload) {
        return { success: false, message: 'Dữ liệu đám mây không hợp lệ' };
      }

      // Tạo snapshot tự động trước khi ghi đè để đảm bảo 100% Data Safety
      storage.createAutomaticSnapshot('Trước khi khôi phục từ Cloud');
      const importSuccess = storage.importBackup(data.payload);

      if (!importSuccess) {
        return { success: false, message: 'Không thể áp dụng dữ liệu từ đám mây' };
      }

      localStorage.setItem('ltmsav_last_cloud_sync', data.updatedAt || new Date().toISOString());
      return { success: true, timestamp: data.updatedAt };
    } catch (error: any) {
      console.error('Error syncing from cloud:', error);
      const msg = error?.message || '';
      const code = error?.code || '';
      
      let userFriendlyMsg = 'Lỗi khôi phục: ' + (error?.message || 'Không xác định');
      if (code === 'permission-denied' || msg.includes('PERMISSION_DENIED') || msg.includes('not been used in project')) {
        userFriendlyMsg = 'Dự án ltmsav chưa kích hoạt Cloud Firestore hoặc chưa mở Rules. Hãy vào console.firebase.google.com/project/ltmsav/firestore để Tạo cơ sở dữ liệu.';
      } else if (code === 'unavailable' || msg.includes('offline')) {
        userFriendlyMsg = 'Không thể kết nối máy chủ Firebase (Cloud Firestore chưa được tạo trên Firebase Console hoặc thiết bị mất mạng).';
      }
      return { success: false, message: userFriendlyMsg };
    }
  }

  public getLastSyncTime(): string | null {
    return localStorage.getItem('ltmsav_last_cloud_sync');
  }
}

export const firebaseAuthService = new FirebaseAuthService();
