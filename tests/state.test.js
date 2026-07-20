import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createJourneyState,
  normaliseAmount,
  estateTotals,
  allocationFlags,
  setRegionStatus,
  upsertRecord
} from '../src/state.js';

test('creates an empty local-only journey', () => {
  assert.deepEqual(createJourneyState(), {
    formatVersion: 1,
    currentRegion: 'origin',
    reducedMotion: false,
    regions: {},
    assets: [],
    debts: [],
    people: [],
    gifts: [],
    notes: []
  });
});

test('tracks explored, relevant and planned without completion pressure', () => {
  let state = createJourneyState();
  state = setRegionStatus(state, 'home', 'relevant');
  state = setRegionStatus(state, 'home', 'planned');
  assert.equal(state.regions.home.status, 'planned');
});

test('upserts one record without duplicating it', () => {
  let state = createJourneyState();
  state = upsertRecord(state, 'assets', { id: 'home-1', regionId: 'home', amount: 10 });
  state = upsertRecord(state, 'assets', { id: 'home-1', regionId: 'home', amount: 20 });
  assert.equal(state.assets.length, 1);
  assert.equal(state.assets[0].amount, 20);
});

test('calculates assets, debts and negative net estate honestly', () => {
  const state = createJourneyState();
  state.assets.push({ id: 'home-1', regionId: 'home', amount: 5000000 });
  state.debts.push({ id: 'loan-1', regionId: 'storms', amount: 6200000 });
  assert.deepEqual(estateTotals(state), {
    assets: 5000000,
    debts: 6200000,
    estimatedNet: -1200000
  });
});

test('rejects invalid amounts instead of silently converting them', () => {
  assert.equal(normaliseAmount('1,200,000'), 1200000);
  assert.equal(normaliseAmount('-1'), null);
  assert.equal(normaliseAmount('abc'), null);
});

test('flags allocations above the estimated net estate', () => {
  const state = createJourneyState();
  state.assets.push({ id: 'cash', regionId: 'vault', amount: 100 });
  state.people.push({ id: 'child', label: '孩子', amount: 80 });
  state.gifts.push({ id: 'education', cause: '教育', amount: 30 });
  assert.ok(allocationFlags(state).some(flag => flag.code === 'over-allocated'));
});
