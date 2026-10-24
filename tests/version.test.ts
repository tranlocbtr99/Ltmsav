import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
test('CI versions increase for new builds and reruns and match UI/Android',()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'ltmsav-version-'));
 try {
 fs.mkdirSync(path.join(folder,'src'));fs.mkdirSync(path.join(folder,'mobile/android/app'),{recursive:true});
 const script=path.resolve('scripts/release-version.mjs');let previous=0;
 for(const [run,attempt] of [[11,1],[11,2],[12,1]]) {
 fs.writeFileSync(path.join(folder,'mobile/android/app/build.gradle'),'versionCode 1\nversionName "1.0"');
 execFileSync(process.execPath,[script],{cwd:folder,env:{...process.env,GITHUB_RUN_NUMBER:String(run),GITHUB_RUN_ATTEMPT:String(attempt),GITHUB_OUTPUT:''}});
 const release=JSON.parse(fs.readFileSync(path.join(folder,'src/release.json'),'utf8'));
 assert.ok(release.versionCode>previous);previous=release.versionCode;
 const gradle=fs.readFileSync(path.join(folder,'mobile/android/app/build.gradle'),'utf8');
 assert.ok(gradle.includes(`versionCode ${release.versionCode}`));assert.ok(gradle.includes(`versionName "${release.version}"`));
 }
 } finally {fs.rmSync(folder,{recursive:true,force:true});}
});
