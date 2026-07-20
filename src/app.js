import { REGIONS } from './regions.js';
import { createJourneyState } from './state.js';
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

state.regions.origin = { status: 'explored' };
renderRegionPanel(REGIONS[0], state.regions.origin);
document.querySelector('#map-status').textContent = `已抵達：${REGIONS[0].name}`;
