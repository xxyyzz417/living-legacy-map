import test from 'node:test';
import assert from 'node:assert/strict';
import { createJourneyState } from '../src/state.js';
import { signalsForState } from '../src/legal-signals.js';

test('does not show conditional joint-property guidance before it is relevant', () => {
  const state = createJourneyState();
  assert.equal(signalsForState(state).some(item => item.id === 'joint-property'), false);
  state.assets.push({ id: 'home', regionId: 'home', joint: true });
  assert.equal(signalsForState(state).some(item => item.id === 'joint-property'), true);
});

test('shows MPF guidance only when the beacon region is being arranged', () => {
  const state = createJourneyState();
  assert.equal(signalsForState(state).some(item => item.id === 'mpf-estate'), false);
  state.assets.push({ id: 'beacon-record', regionId: 'beacon' });
  assert.equal(signalsForState(state).some(item => item.id === 'mpf-estate'), true);
});

test('every shipped signpost has a dated official source and a question', () => {
  const state = createJourneyState();
  state.assets.push({ id: 'home', regionId: 'home', joint: true });
  state.assets.push({ id: 'beacon', regionId: 'beacon' });
  for (const signal of signalsForState(state)) {
    assert.match(signal.sourceUrl, /^https:\/\//);
    assert.match(signal.verifiedOn, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(signal.lawyerQuestion.endsWith('？'));
    assert.ok(signal.regions.length > 0);
  }
});
