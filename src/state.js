export function createJourneyState() {
  return {
    formatVersion: 1,
    currentRegion: 'origin',
    reducedMotion: false,
    regions: {},
    assets: [],
    debts: [],
    people: [],
    gifts: [],
    notes: []
  };
}

export function normaliseAmount(value) {
  const cleaned = String(value ?? '').replaceAll(',', '').trim();
  if (!cleaned) return null;
  const amount = Number(cleaned);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function sumAmounts(items) {
  return items.reduce((sum, item) => sum + (normaliseAmount(item.amount) ?? 0), 0);
}

export function estateTotals(state) {
  const assets = sumAmounts(state.assets);
  const debts = sumAmounts(state.debts);
  return { assets, debts, estimatedNet: assets - debts };
}

export function allocationFlags(state) {
  const { estimatedNet } = estateTotals(state);
  const allocated = sumAmounts([...state.people, ...state.gifts]);
  const flags = [];

  if (allocated > Math.max(estimatedNet, 0)) {
    flags.push({
      code: 'over-allocated',
      message: '已記錄的金額高於初步估算淨遺產，值得帶給香港律師確認。'
    });
  }

  if (estimatedNet < 0) {
    flags.push({
      code: 'negative-net',
      message: '目前記錄的債務高於資產；這只是初步整理，值得進一步確認。'
    });
  }

  return flags;
}

export function setRegionStatus(state, regionId, status) {
  return {
    ...state,
    regions: {
      ...state.regions,
      [regionId]: { ...(state.regions[regionId] ?? {}), status }
    }
  };
}

export function upsertRecord(state, collection, record) {
  const records = state[collection];
  const index = records.findIndex(item => item.id === record.id);
  const next = index < 0
    ? [...records, record]
    : records.map((item, itemIndex) => itemIndex === index ? { ...item, ...record } : item);
  return { ...state, [collection]: next };
}
