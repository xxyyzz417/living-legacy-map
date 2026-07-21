import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('ships the semantic long-scroll journey shell', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  for (const id of [
    'map-stage', 'map-camera', 'region-title', 'region-copy', 'region-actions',
    'legal-signpost', 'map-status', 'record-dialog', 'personal-report', 'solicitor-report'
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /<script type="module" src="src\/app\.js"><\/script>/);
});

test('does not contain the memorial-game framing', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  for (const term of ['先人', '生前喜歡', '生前職業', '大亨', 'RPG', '社會影響力指數', '永久冠名', '彩帶']) {
    assert.equal(html.includes(term), false, `unexpected old term: ${term}`);
  }
});

test('includes an explicit password step for private full drafts', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id=["']draft-password-dialog["']/);
  assert.match(html, /忘記密碼後無法恢復完整草稿/);
});

test('keeps exact amounts out of the personal PDF unless explicitly selected', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id=["']include-personal-amounts["']/);
  assert.match(html, /type=["']checkbox["']/);
});

test('uses the long scroll instead of next-page controls', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id=["']scroll-route["']/);
  assert.doesNotMatch(html, /id=["'](?:previous|next)-region["']/);
  assert.doesNotMatch(html, />下一處<|>上一處</);
});
