import { REGIONS } from './regions.js';
import { createJourneyState } from './state.js';
import { createRevealController } from './reveal-controller.js';
import { renderRecordForm, renderRegionPanel } from './ui.js';
import { collectionForRecordType, recordFromValues } from './record-model.js';
import { setRegionStatus, upsertRecord } from './state.js';

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
let recordOpener = null;
let activeRegion = null;

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
