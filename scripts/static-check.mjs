import { readFile, readdir } from 'node:fs/promises';

const sourceFiles = (await readdir('src')).filter(name => name.endsWith('.js')).map(name => `src/${name}`);
const files = ['index.html', 'styles.css', ...sourceFiles];
const text = (await Promise.all(files.map(file => readFile(file, 'utf8')))).join('\n');

const banned = ['先人', '生前喜歡', '大亨', '社會影響力指數', '永久冠名'];
for (const term of banned) {
  if (text.includes(term)) throw new Error(`Banned or unresolved term: ${term}`);
}

const privacyRisks = [
  /fetch\s*\(/,
  /XMLHttpRequest/,
  /localStorage/,
  /sessionStorage/,
  /navigator\.sendBeacon/,
  /URLSearchParams/,
  /location\.(?:search|hash)\s*=/
];
for (const pattern of privacyRisks) {
  if (pattern.test(text)) throw new Error(`Unexpected network or persistence API: ${pattern}`);
}

console.log(`Static checks passed across ${files.length} files.`);
