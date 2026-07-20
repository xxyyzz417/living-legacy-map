import test from 'node:test';
import assert from 'node:assert/strict';
import { collectionForRecordType, recordFromValues } from '../src/record-model.js';

test('maps record types to state collections', () => {
  assert.equal(collectionForRecordType('asset'), 'assets');
  assert.equal(collectionForRecordType('debt'), 'debts');
  assert.equal(collectionForRecordType('person'), 'people');
  assert.equal(collectionForRecordType('gift'), 'gifts');
});

test('creates an exact asset record from optional drawer values', () => {
  assert.deepEqual(recordFromValues({ id: 'home-1', regionId: 'home', recordType: 'asset' }, {
    label: '我的家', amountMode: 'exact', amount: '8,000,000', destination: '伴侶', joint: true
  }), {
    id: 'home-1', regionId: 'home', label: '我的家', amountMode: 'exact', amount: 8000000,
    destination: '伴侶', joint: true, mortgage: false, overseas: false
  });
});

test('rejects an invalid required amount without losing the values', () => {
  assert.throws(() => recordFromValues({ id: 'cash-1', regionId: 'vault', recordType: 'asset' }, {
    label: '儲蓄', amountMode: 'exact', amount: '-1'
  }), /有效金額/);
});

test('records a respectful decision not to make a charitable gift', () => {
  assert.deepEqual(recordFromValues({ id: 'gift-1', regionId: 'tomorrow', recordType: 'gift' }, {
    cause: 'none', amountMode: 'unknown'
  }), {
    id: 'gift-1', regionId: 'tomorrow', cause: 'none', declined: true,
    amountMode: 'unknown', amount: null, organisation: '', destination: ''
  });
});
