import { REGIONS } from './regions.js';
import { createJourneyState } from './state.js';
import { createRevealController } from './reveal-controller.js';
import { renderRegionPanel } from './ui.js';

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

const controller = createRevealController({
  regions: REGIONS,
  onChange(region, index) {
    state.currentRegion = region.id;
    state.regions[region.id] ??= { status: 'explored' };
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
