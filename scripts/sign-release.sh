#!/usr/bin/env bash
set -euo pipefail
node -e 'const r=JSON.parse(require("fs").readFileSync("release.json")); if((r.baselineVerified !== true && r.userApprovedRepackage !== true) || r.releaseStatus !== "ready") { console.error("Release blocked: verify the installed 1.9.2410 APK, its source, versionCode and signing certificate first."); process.exit(1); }'

: "${ANDROID_HOME:?}" "${KEYSTORE_PATH:?}" "${KEYSTORE_PASSWORD:?}" "${KEY_ALIAS:?}" "${KEY_PASSWORD:?}"
BUILD_TOOLS="$ANDROID_HOME/build-tools/35.0.0"
OUT="build-output"
mkdir -p "$OUT"
VERSION=$(node -p 'JSON.parse(require("fs").readFileSync("release.json")).versionName')
EXPECTED=$(node -p 'JSON.parse(require("fs").readFileSync("release.json")).certificateSha256')
EXPECTED_CODE=$(node -p 'JSON.parse(require("fs").readFileSync("release.json")).versionCode')
APK="$OUT/LTMsav_${VERSION}.apk"
AAB="$OUT/LTMsav_${VERSION}.aab"
"$BUILD_TOOLS/zipalign" -f -p 4 mobile/android/app/build/outputs/apk/release/app-release-unsigned.apk "$OUT/aligned.apk"
trap 'rm -f "$OUT/aligned.apk"' EXIT
"$BUILD_TOOLS/apksigner" sign --ks "$KEYSTORE_PATH" --ks-key-alias "$KEY_ALIAS" --ks-pass env:KEYSTORE_PASSWORD --key-pass env:KEY_PASSWORD --out "$APK" "$OUT/aligned.apk"
"$BUILD_TOOLS/apksigner" verify --verbose --print-certs "$APK" > "$OUT/signature.txt"
ACTUAL=$(sed -n 's/^Signer #1 certificate SHA-256 digest: //p' "$OUT/signature.txt")
test "$ACTUAL" = "$EXPECTED" || { rm -f "$APK"; echo 'Signing certificate mismatch'; exit 1; }
"$BUILD_TOOLS/zipalign" -c -p 4 "$APK"
"$BUILD_TOOLS/aapt" dump badging "$APK" > "$OUT/package.txt"
node scripts/verify-package.mjs "$OUT/package.txt"
cp mobile/android/app/build/outputs/bundle/release/app-release.aab "$AAB"
jarsigner -keystore "$KEYSTORE_PATH" -storepass:env KEYSTORE_PASSWORD -keypass:env KEY_PASSWORD -sigalg SHA256withRSA -digestalg SHA-256 "$AAB" "$KEY_ALIAS"
jarsigner -verify "$AAB"
keytool -printcert -jarfile "$AAB" > "$OUT/bundle-certificate.txt"
BUNDLE_CERT=$(sed -n 's/.*SHA256: //p' "$OUT/bundle-certificate.txt" | tr -d ':' | tr 'A-F' 'a-f')
test "$BUNDLE_CERT" = "$EXPECTED"
(cd "$OUT" && sha256sum "LTMsav_${VERSION}.apk" "LTMsav_${VERSION}.aab" > SHA256SUMS)
