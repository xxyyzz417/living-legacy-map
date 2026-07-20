import { allocationFlags, estateTotals } from './state.js';

const DISCLAIMER = '這是一份意願整理資料，不是遺囑，也沒有法律效力。請讓香港執業律師根據你的情況確認正式安排。';

const withoutAmount = item => {
  const { amount, ...rest } = item;
  return rest;
};

export function personalReportModel(state, { includeAmounts = false } = {}) {
  const project = item => includeAmounts ? { ...item } : withoutAmount(item);
  return {
    title: '我的心願地圖',
    disclaimer: DISCLAIMER,
    regions: state.regions,
    assets: state.assets.map(project),
    debts: state.debts.map(project),
    people: state.people.map(project),
    gifts: state.gifts.map(project),
    notes: state.notes,
    undecided: Object.entries(state.regions)
      .filter(([, value]) => value.status !== 'planned')
      .map(([id]) => id)
  };
}

export function solicitorReportModel(state, legalSignals = []) {
  return {
    title: '給香港律師看的遺產與公益遺贈意願資料',
    disclaimer: DISCLAIMER,
    totals: estateTotals(state),
    flags: allocationFlags(state),
    assets: state.assets.map(item => ({ ...item })),
    debts: state.debts.map(item => ({ ...item })),
    people: state.people.map(item => ({ ...item })),
    gifts: state.gifts.map(item => ({ ...item })),
    notes: [...state.notes],
    lawyerQuestions: legalSignals.map(signal => ({
      question: signal.lawyerQuestion,
      source: signal.sourceName,
      url: signal.sourceUrl,
      verifiedOn: signal.verifiedOn
    }))
  };
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function displayValue(value) {
  if (value === null || value === undefined || value === '') return '未填寫';
  if (typeof value === 'boolean') return value ? '是' : '否';
  if (typeof value === 'number') return `HK$ ${value.toLocaleString('zh-HK')}`;
  return String(value);
}

function appendRecords(root, heading, records) {
  root.append(element('h2', heading));
  if (!records.length) {
    root.append(element('p', '這一部分尚未記下安排。', 'empty-report-section'));
    return;
  }
  const table = document.createElement('table');
  const body = document.createElement('tbody');
  records.forEach((record, index) => {
    const row = document.createElement('tr');
    const label = element('th', record.label || record.cause || `記錄 ${index + 1}`);
    label.scope = 'row';
    const details = Object.entries(record)
      .filter(([key]) => !['id', 'regionId', 'label', 'cause'].includes(key))
      .map(([key, value]) => `${key}：${displayValue(value)}`)
      .join('；');
    row.append(label, element('td', details || '已記下方向'));
    body.append(row);
  });
  table.append(body);
  root.append(table);
}

export function renderReport(model, root) {
  root.replaceChildren();
  root.append(element('h1', model.title), element('p', model.disclaimer, 'report-disclaimer'));
  appendRecords(root, '財產', model.assets ?? []);
  appendRecords(root, '債務與責任', model.debts ?? []);
  appendRecords(root, '想照顧的人', model.people ?? []);
  appendRecords(root, '公益遺贈方向', model.gifts ?? []);
  if (model.flags?.length) {
    root.append(element('h2', '值得帶給律師確認'));
    const list = document.createElement('ul');
    model.flags.forEach(flag => list.append(element('li', flag.message)));
    root.append(list);
  }
  if (model.lawyerQuestions?.length) {
    root.append(element('h2', '可以向律師提出的問題'));
    const list = document.createElement('ul');
    model.lawyerQuestions.forEach(item => list.append(element('li', `${item.question}（${item.source}，核對日期 ${item.verifiedOn}）`)));
    root.append(list);
  }
  return root;
}
