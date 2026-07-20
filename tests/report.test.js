import test from 'node:test';
import assert from 'node:assert/strict';
import { createJourneyState } from '../src/state.js';
import { personalReportModel, solicitorReportModel } from '../src/report.js';

test('personal model hides exact amounts by default', () => {
  const state = createJourneyState();
  state.assets.push({ id: 'home', label: '我的家', amount: 8000000, destination: '伴侶' });
  assert.equal(JSON.stringify(personalReportModel(state)).includes('8000000'), false);
});

test('personal model includes amounts only by explicit choice', () => {
  const state = createJourneyState();
  state.assets.push({ id: 'home', label: '我的家', amount: 8000000 });
  assert.equal(personalReportModel(state, { includeAmounts: true }).assets[0].amount, 8000000);
});

test('solicitor model includes details and non-will disclaimer', () => {
  const state = createJourneyState();
  state.assets.push({ id: 'home', label: '我的家', amount: 8000000, destination: '伴侶' });
  const model = solicitorReportModel(state, []);
  assert.equal(model.assets[0].amount, 8000000);
  assert.match(model.disclaimer, /不是遺囑|沒有法律效力/);
});

test('solicitor model includes only supplied contextual questions', () => {
  const model = solicitorReportModel(createJourneyState(), [{
    lawyerQuestion: '需要怎樣安排？', sourceName: '官方來源', sourceUrl: 'https://example.test', verifiedOn: '2026-07-21'
  }]);
  assert.deepEqual(model.lawyerQuestions, [{
    question: '需要怎樣安排？', source: '官方來源', url: 'https://example.test', verifiedOn: '2026-07-21'
  }]);
});
