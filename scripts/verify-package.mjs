import fs from 'node:fs';
import assert from 'node:assert/strict';
const release=JSON.parse(fs.readFileSync('release.json'));
const text=fs.readFileSync(process.argv[2],'utf8');
assert.ok(text.includes(`name='${release.applicationId}'`));
assert.ok(text.includes(`versionCode='${release.versionCode}'`));
assert.ok(text.includes(`versionName='${release.versionName}'`));
assert.ok(!text.includes('application-debuggable'));
