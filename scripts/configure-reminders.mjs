import fs from 'node:fs';
const p='mobile/android/app/src/main/AndroidManifest.xml';
let xml=fs.readFileSync(p,'utf8');
for(const permission of ['POST_NOTIFICATIONS','RECEIVE_BOOT_COMPLETED']) {
 if(!xml.includes(`android.permission.${permission}`))xml=xml.replace('</manifest>',`<uses-permission android:name="android.permission.${permission}" /></manifest>`);
}
if(!xml.includes('.ReminderReceiver'))xml=xml.replace('</application>',`<receiver android:name=".ReminderReceiver" android:enabled="true" android:exported="false"><intent-filter><action android:name="android.intent.action.BOOT_COMPLETED"/><action android:name="android.intent.action.TIMEZONE_CHANGED"/><action android:name="android.intent.action.TIME_SET"/><action android:name="android.intent.action.MY_PACKAGE_REPLACED"/></intent-filter></receiver></application>`);
fs.writeFileSync(p,xml);
