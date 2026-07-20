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
      message: '已记录的金额高于初步估算净遗产，值得带给香港律师确认。'
    });
  }

  if (estimatedNet < 0) {
    flags.push({
      code: 'negative-net',
      message: '目前记录的债务高于资产；这只是初步整理，值得进一步确认。'
    });
  }

  return flags;
}
