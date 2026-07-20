import { cameraVariables, clampRegionIndex, navigationIndex } from './map-model.js';

export function createRevealController({ regions, onChange }) {
  let index = 0;
  const markers = [...document.querySelectorAll('.scroll-sentinel')];
  const camera = document.querySelector('#map-camera');
  const fog = document.querySelector('#fog-layer');

  function goTo(nextIndex, { scroll = false } = {}) {
    index = clampRegionIndex(nextIndex, regions.length);
    const region = regions[index];
    const variables = cameraVariables(region.camera);

    for (const [name, value] of Object.entries(variables)) {
      (name.startsWith('--fog') ? fog : camera).style.setProperty(name, value);
    }

    camera.style.transform = 'translate(calc(50% - var(--camera-x)), calc(50% - var(--camera-y))) scale(var(--camera-scale))';
    onChange(region, index);

    if (scroll) {
      markers[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  const observer = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) goTo(Number(visible.target.dataset.regionIndex));
  }, { threshold: [0.55, 0.75] });

  markers.forEach(marker => observer.observe(marker));

  return {
    goTo,
    next() { goTo(navigationIndex(index, 'next', regions.length), { scroll: true }); },
    previous() { goTo(navigationIndex(index, 'previous', regions.length), { scroll: true }); },
    currentIndex() { return index; },
    destroy() { observer.disconnect(); }
  };
}
