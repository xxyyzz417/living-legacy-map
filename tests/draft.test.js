import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createJourneyState } from '../src/state.js';
import { lightDraft, encryptFullDraft, decryptFullDraft, parseLightDraft } from '../src/draft.js';

globalThis.crypto ??= webcrypto;

test('light draft excludes amounts but keeps journey direction', () => {
  const state = createJourneyState();
  state.assets.push({ id: 'home', regionId: 'home', amount: 9000000, destination: '伴侶' });
  const parsed = parseLightDraft(lightDraft(state));
  assert.equal(parsed.assets[0].amount, undefined);
  assert.equal(parsed.assets[0].destination, '伴侶');
});

test('full encrypted draft round-trips with the password', async () => {
  const state = createJourneyState();
  state.assets.push({ id: 'cash', regionId: 'vault', amount: 123456 });
  const encrypted = await encryptFullDraft(state, 'correct horse battery staple');
  const restored = await decryptFullDraft(encrypted, 'correct horse battery staple');
  assert.equal(restored.assets[0].amount, 123456);
  await assert.rejects(() => decryptFullDraft(encrypted, 'wrong password'), /密碼|讀取/);
});

test('rejects a short encryption password', async () => {
  await assert.rejects(() => encryptFullDraft(createJourneyState(), 'too-short'), /12/);
});

test('rejects corrupt light drafts', () => {
  assert.throws(() => parseLightDraft('{"format":"other"}'), /明日藏寶圖|讀取/);
});
