import fs from 'node:fs';
// run_number increases automatically; run_attempt disambiguates reruns. Reserve code range.
const run = Number(process.env.GITHUB_RUN_NUMBER);
const attempt = Number(process.env.GITHUB_RUN_ATTEMPT || 1);
if (!Number.isSafeInteger(run) || run < 1 || !Number.isSafeInteger(attempt) || attempt < 1 || attempt > 99) throw new Error('Invalid CI version inputs');
const code = 10000 + run * 100 + attempt;
const version = `1.9.${code - 10000}`;
fs.writeFileSync('src/release.json', JSON.stringify({ version, versionCode: code }, null, 2) + '\n');
const file = 'mobile/android/app/build.gradle';
let gradle = fs.readFileSync(file, 'utf8');
if (!/versionCode\s+\d+/.test(gradle) || !/versionName\s+"[^"]+"/.test(gradle)) throw new Error('Missing Android version fields');
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${code}`).replace(/versionName\s+"[^"]+"/, `versionName "${version}"`);
fs.writeFileSync(file, gradle);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\ncode=${code}\n`);
console.log(`LTMsav ${version} (${code})`);
