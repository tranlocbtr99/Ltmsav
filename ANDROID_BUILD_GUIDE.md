# LTMsav Android – build instructions

This project packages the existing React/Vite interface as an Android application using Capacitor. The pre-existing `android/` Kotlin prototype is retained for reference; **the actual packaging project is under `mobile/`**.

## Automated build

1. Upload this source to a GitHub repository.
2. Open **Actions → Android APK and AAB → Run workflow**.
3. Download **LTMsav-Android-debug-APK** for sideload testing.
4. The **LTMsav-Android-unsigned-AAB** is NOT ready for Play Store upload: sign a release bundle with a secure, privately held upload key, then verify Google Play target API and policy requirements.

## Local build

Requirements: Node 22, JDK 17, Android SDK, internet for dependencies.

```bash
npm install
npm run lint
npm run build
cd mobile
npm install
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug bundleRelease
```

Debug APK: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`.

## Before publishing

- **AI assistant** currently calls `/api/chat` on the web server. Relative calls do not reach the server in the packaged app. Configure a deployed HTTPS backend, authenticate requests and never embed a Gemini API secret in the APK. Test the AI feature separately.
- The web app stores user financial data locally. Test backup/restore, app updates, WebView storage persistence, offline operation, accessibility, permissions, and device behavior.
- Prepare a privacy policy, data safety disclosures, store listing, screenshots, support contact, release signing, versioning, and real-device testing.
- Do not upload an unsigned AAB or use a debug APK for production. Play Console may require newer target SDK levels than the generated template; check current requirements at release time.
- Do not commit keystores, passwords, API tokens, or production environment secrets.

**Build status:** Source prepared; no Android SDK or Gradle build was available in the authoring environment. Artifacts must be built and tested before being described as installable or Play-ready.
