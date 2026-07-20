import { REGIONS } from './regions.js';
import { createJourneyState } from './state.js';
import { createRevealController } from './reveal-controller.js';
import { renderRecordForm, renderRegionPanel } from './ui.js';
import { collectionForRecordType, recordFromValues } from './record-model.js';
import { setRegionStatus, upsertRecord } from './state.js';
import { decryptFullDraft, encryptFullDraft, lightDraft, parseLightDraft } from './draft.js';
import { personalReportModel, renderReport, solicitorReportModel } from './report.js';
import { downloadReportPdf, reportFilename } from './pdf.js';

let state = createJourneyState();
const route = document.querySelector('#scroll-route');

route.replaceChildren(...REGIONS.map((region, index) => {
  const marker = document.createElement('div');
  marker.className = 'scroll-sentinel';
  marker.dataset.regionIndex = String(index);
  marker.id = `route-${region.id}`;
  return marker;
}));

const previousButton = document.querySelector('#previous-region');
const nextButton = document.querySelector('#next-region');
const destinationActions = document.querySelector('#destination-actions');
const motionButton = document.querySelector('#motion-toggle');
const regionActions = document.querySelector('#region-actions');
const recordDialog = document.querySelector('#record-dialog');
const passwordDialog = document.querySelector('#draft-password-dialog');
const passwordForm = document.querySelector('#draft-password-form');
const draftFile = document.querySelector('#draft-file');
let recordOpener = null;
let activeRegion = null;
let passwordMode = 'export';
let pendingEncryptedDraft = '';

const controller = createRevealController({
  regions: REGIONS,
  onChange(region, index) {
    state.currentRegion = region.id;
    state.regions[region.id] ??= { status: 'explored' };
    activeRegion = region;
    renderRegionPanel(region, state.regions[region.id]);
    document.querySelector('#map-status').textContent = `已抵達：${region.name}`;
    previousButton.disabled = index === 0;
    nextButton.disabled = index === REGIONS.length - 1;
    destinationActions.hidden = region.id !== 'destination';
  }
});

previousButton.addEventListener('click', controller.previous);
nextButton.addEventListener('click', controller.next);

document.addEventListener('keydown', event => {
  const tag = event.target.tagName;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || event.target.closest('dialog')) return;
  if (event.key === 'ArrowDown') controller.next();
  if (event.key === 'ArrowUp') controller.previous();
});

motionButton.addEventListener('click', () => {
  state.reducedMotion = !state.reducedMotion;
  document.documentElement.dataset.motion = state.reducedMotion ? 'reduced' : 'full';
  motionButton.textContent = state.reducedMotion ? '恢復動畫' : '減少動畫';
  motionButton.setAttribute('aria-pressed', String(state.reducedMotion));
});

controller.goTo(0);

regionActions.addEventListener('click', event => {
  const button = event.target.closest('[data-region-action]');
  if (!button || !activeRegion?.recordType) return;
  if (button.dataset.regionAction === 'relevant') {
    state = setRegionStatus(state, activeRegion.id, 'relevant');
    renderRegionPanel(activeRegion, state.regions[activeRegion.id]);
    return;
  }
  if (button.dataset.regionAction !== 'plan') return;
  recordOpener = button;
  document.querySelector('#record-title').textContent = `安排：${activeRegion.name}`;
  const form = renderRecordForm(activeRegion);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    values.joint = form.elements.joint?.checked ?? false;
    values.mortgage = form.elements.mortgage?.checked ?? false;
    values.overseas = form.elements.overseas?.checked ?? false;
    try {
      const record = recordFromValues({
        id: `${activeRegion.id}-record`,
        regionId: activeRegion.id,
        recordType: activeRegion.recordType
      }, values);
      state = upsertRecord(state, collectionForRecordType(activeRegion.recordType), record);
      state = setRegionStatus(state, activeRegion.id, 'planned');
      renderRegionPanel(activeRegion, state.regions[activeRegion.id]);
      recordDialog.close('saved');
    } catch (error) {
      document.querySelector('#record-error').textContent = error.message;
    }
  });
  recordDialog.showModal();
});

recordDialog.addEventListener('close', () => {
  const regionId = recordOpener?.dataset.regionId;
  const action = recordOpener?.dataset.regionAction;
  document.querySelector(`[data-region-id="${regionId}"][data-region-action="${action}"]`)?.focus();
  recordOpener = null;
});

function downloadText(text, filename, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function validJourney(value) {
  return value?.formatVersion === 1
    && ['assets', 'debts', 'people', 'gifts', 'notes'].every(key => Array.isArray(value[key]))
    && value.regions && typeof value.regions === 'object';
}

function restoreJourney(candidate) {
  if (!validJourney(candidate)) throw new Error('草稿內容不完整，沒有取代你現在的旅程。');
  state = candidate;
  const index = REGIONS.findIndex(region => region.id === state.currentRegion);
  controller.goTo(index < 0 ? 0 : index, { scroll: true });
}

document.querySelector('#download-light-draft').addEventListener('click', () => {
  downloadText(lightDraft(state), '明日藏寶圖-輕量草稿.json');
});

document.querySelector('#download-full-draft').addEventListener('click', () => {
  passwordMode = 'export';
  passwordForm.reset();
  document.querySelector('#draft-password-title').textContent = '保護完整草稿';
  document.querySelector('#draft-password-copy').textContent = '完整草稿包含你填寫的金額。忘記密碼後無法恢復完整草稿。';
  document.querySelector('#draft-password-confirm-label').hidden = false;
  document.querySelector('#draft-password-submit').textContent = '下載加密草稿';
  document.querySelector('#draft-password-error').textContent = '';
  passwordDialog.showModal();
});

document.querySelector('#import-trigger').addEventListener('click', () => draftFile.click());

draftFile.addEventListener('change', async () => {
  const file = draftFile.files?.[0];
  draftFile.value = '';
  if (!file) return;
  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    if (payload?.kind === 'encrypted-full') {
      pendingEncryptedDraft = text;
      passwordMode = 'import';
      passwordForm.reset();
      document.querySelector('#draft-password-title').textContent = '開啟完整草稿';
      document.querySelector('#draft-password-copy').textContent = '輸入建立完整草稿時使用的密碼。資料只會在這個裝置內解密。';
      document.querySelector('#draft-password-confirm-label').hidden = true;
      document.querySelector('#draft-password-submit').textContent = '開啟草稿';
      document.querySelector('#draft-password-error').textContent = '';
      passwordDialog.showModal();
      return;
    }
    restoreJourney(parseLightDraft(text));
  } catch (error) {
    document.querySelector('#map-status').textContent = error.message || '草稿文件無法讀取。';
  }
});

passwordForm.addEventListener('submit', async event => {
  event.preventDefault();
  const password = passwordForm.elements.password.value;
  const error = document.querySelector('#draft-password-error');
  error.textContent = '';
  try {
    if (passwordMode === 'export') {
      if (password !== passwordForm.elements.confirmation.value) throw new Error('兩次輸入的密碼不相同。');
      const encrypted = await encryptFullDraft(state, password);
      downloadText(encrypted, '明日藏寶圖-完整加密草稿.legacy-map');
    } else {
      const candidate = await decryptFullDraft(pendingEncryptedDraft, password);
      restoreJourney(candidate);
      pendingEncryptedDraft = '';
    }
    passwordDialog.close('completed');
  } catch (problem) {
    error.textContent = problem.message;
  }
});

async function exportReport(kind) {
  const isPersonal = kind === 'personal';
  const root = document.querySelector(isPersonal ? '#personal-report' : '#solicitor-report');
  const model = isPersonal
    ? personalReportModel(state, {
      includeAmounts: document.querySelector('#include-personal-amounts').checked
    })
    : solicitorReportModel(state, []);
  renderReport(model, root);
  root.classList.add('pdf-export');
  document.querySelector('#map-status').textContent = '正在準備 PDF…';
  try {
    await downloadReportPdf(root, reportFilename(kind));
    document.querySelector('#map-status').textContent = 'PDF 已準備完成。';
  } finally {
    root.classList.remove('pdf-export');
    root.replaceChildren();
  }
}

document.querySelector('#download-personal-pdf').addEventListener('click', () => exportReport('personal'));
document.querySelector('#download-solicitor-pdf').addEventListener('click', () => exportReport('solicitor'));
