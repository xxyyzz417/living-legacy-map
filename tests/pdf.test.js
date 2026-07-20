import test from 'node:test';
import assert from 'node:assert/strict';
import { downloadReportPdf, reportFilename } from '../src/pdf.js';

test('creates dated Traditional Chinese report filenames', () => {
  assert.equal(reportFilename('personal', new Date('2026-07-21T00:00:00Z')), '我的心願地圖-2026-07-21.pdf');
  assert.equal(reportFilename('solicitor', new Date('2026-07-21T00:00:00Z')), '給香港律師看的遺產意願資料-2026-07-21.pdf');
});

test('uses print fallback when the PDF bundle is unavailable', async () => {
  const originalPrint = globalThis.print;
  let printed = false;
  globalThis.print = () => { printed = true; };
  const root = { dataset: {} };
  try {
    assert.deepEqual(await downloadReportPdf(root, 'report.pdf'), { fallback: true });
    assert.equal(printed, true);
    assert.equal(root.dataset.printTarget, undefined);
  } finally {
    globalThis.print = originalPrint;
  }
});
