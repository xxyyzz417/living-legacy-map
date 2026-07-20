export function renderRegionPanel(region, regionState = {}) {
  document.querySelector('#region-title').textContent = region.name;
  document.querySelector('#region-copy').textContent = region.copy;
  document.querySelector('#region-eyebrow').textContent = regionState.status === 'planned'
    ? '已記下心願'
    : regionState.status === 'relevant'
      ? '這與你有關'
      : '已探索';
}
