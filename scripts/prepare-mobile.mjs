import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const release = JSON.parse(fs.readFileSync('release.json'));
const config = JSON.parse(fs.readFileSync('mobile/capacitor.config.json'));
if(config.appId !== release.applicationId || config.server?.url || config.server?.hostname || config.server?.androidScheme) {
  throw Error('Do not change application ID or persisted WebView origin');
}
if(!Number.isSafeInteger(release.versionCode) || release.versionCode <= release.previousVersionCode) throw Error('versionCode must increase');
fs.rmSync('mobile/dist', {recursive:true,force:true});
fs.cpSync('dist','mobile/dist',{recursive:true});
execFileSync('npx',['--no-install','cap',fs.existsSync('mobile/android')?'sync':'add','android'],{cwd:'mobile',stdio:'inherit'});
const app='mobile/android/app';
let gradle=fs.readFileSync(`${app}/build.gradle`,'utf8');
gradle=gradle.replace(/versionCode \d+/,`versionCode ${release.versionCode}`).replace(/versionName "[^"]+"/,`versionName "${release.versionName}"`);
if(!gradle.includes('androidx.biometric:biometric')) gradle=gradle.replace('dependencies {','dependencies {\n    implementation "androidx.biometric:biometric:1.1.0"');
fs.writeFileSync(`${app}/build.gradle`,gradle);
const java=`${app}/src/main/java/com/ltmsav/app`;
fs.mkdirSync(java,{recursive:true});
for(const file of fs.readdirSync('mobile/custom_android')) if(file.endsWith('.java')) fs.copyFileSync(path.join('mobile/custom_android',file),path.join(java,file));
const manifest=`${app}/src/main/AndroidManifest.xml`;
let xml=fs.readFileSync(manifest,'utf8');
if(!xml.includes('android.permission.USE_BIOMETRIC')) xml=xml.replace('    <application','    <uses-permission android:name="android.permission.USE_BIOMETRIC" />\n    <application');
fs.writeFileSync(manifest,xml);
// Generate launcher icons from the one versioned source after platform creation.
execFileSync('python3',['scripts/update_logo.py','assets/logo-source.png'],{stdio:'inherit'});
