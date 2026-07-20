export function clampRegionIndex(index, count) {
  return Math.max(0, Math.min(count - 1, Math.trunc(index)));
}

export function indexForProgress(progress, count) {
  const safe = Math.max(0, Math.min(1, Number(progress) || 0));
  return clampRegionIndex(Math.round(safe * (count - 1)), count);
}

export function cameraVariables(camera) {
  return {
    '--camera-x': `${camera.x}%`,
    '--camera-y': `${camera.y}%`,
    '--camera-scale': String(camera.scale),
    '--fog-x': `${camera.x}%`,
    '--fog-y': `${camera.y}%`
  };
}
