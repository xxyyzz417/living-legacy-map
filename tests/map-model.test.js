import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampRegionIndex,
  indexForProgress,
  cameraVariables,
  navigationIndex
} from '../src/map-model.js';

test('maps the top and bottom of the long scroll to route endpoints', () => {
  assert.equal(indexForProgress(0, 11), 0);
  assert.equal(indexForProgress(1, 11), 10);
});

test('moves alternative navigation one bounded region at a time', () => {
  assert.equal(navigationIndex(0, 'previous', 11), 0);
  assert.equal(navigationIndex(0, 'next', 11), 1);
  assert.equal(navigationIndex(10, 'next', 11), 10);
});

test('clamps alternative navigation', () => {
  assert.equal(clampRegionIndex(-2, 11), 0);
  assert.equal(clampRegionIndex(99, 11), 10);
});

test('creates CSS camera and fog variables', () => {
  assert.deepEqual(cameraVariables({ x: 46, y: 72, scale: 1.4 }), {
    '--camera-x': '46%',
    '--camera-y': '72%',
    '--camera-scale': '1.4',
    '--fog-x': '46%',
    '--fog-y': '72%'
  });
});
