export function renderRegionPanel(region, regionState = {}, signals = []) {
  document.querySelector('#region-title').textContent = region.name;
  document.querySelector('#region-copy').textContent = region.copy;
  document.querySelector('#region-eyebrow').textContent = regionState.status === 'planned'
    ? '已記下心願'
    : regionState.status === 'relevant'
      ? '這與你有關'
      : '已探索';

  const actions = document.querySelector('#region-actions');
  actions.replaceChildren();
  const signpost = document.querySelector('#legal-signpost');
  signpost.replaceChildren();
  for (const signal of signals.filter(item => item.regions.includes(region.id))) {
    const details = document.createElement('details');
    details.className = 'signpost-card';
    const summary = document.createElement('summary');
    summary.textContent = signal.title;
    const copy = document.createElement('p');
    copy.textContent = signal.summary;
    const question = document.createElement('p');
    question.textContent = `可以問律師：${signal.lawyerQuestion}`;
    const source = document.createElement('a');
    source.href = signal.sourceUrl;
    source.target = '_blank';
    source.rel = 'noreferrer';
    source.textContent = `${signal.sourceName}（核對日期 ${signal.verifiedOn}）`;
    details.append(summary, copy, question, source);
    signpost.append(details);
  }
  if (!region.recordType) return;

  for (const [action, label] of [
    ['observe', '只是看看'],
    ['relevant', '這與你有關'],
    ['plan', '我想安排這裡']
  ]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.regionAction = action;
    button.dataset.regionId = region.id;
    button.textContent = label;
    actions.append(button);
  }
}

export function renderRecordForm(region) {
  const body = document.querySelector('#record-body');
  body.replaceChildren();
  const form = document.createElement('form');
  form.id = 'record-form';
  form.className = 'record-form';
  form.innerHTML = `
    <p class="form-hint">只填你現在想整理的部分；不知道或想稍後再補，可以保留空白。</p>
    <label>名稱或簡短描述<input name="label" autocomplete="off"></label>
    <label>金額狀態<select name="amountMode"><option value="unknown">現在不知道</option><option value="exact">我知道精確金額</option><option value="later">稍後再補</option></select></label>
    <label data-amount-field>金額（港幣）<input name="amount" inputmode="decimal" placeholder="例如 8000000"></label>
    ${region.recordType === 'asset' ? '<label>希望去向<input name="destination" placeholder="例如伴侶、子女、某個用途"></label><label class="check"><input type="checkbox" name="joint"> 這是聯名或共同持有</label><label class="check"><input type="checkbox" name="mortgage"> 可能有按揭或抵押</label><label class="check"><input type="checkbox" name="overseas"> 這項資產在香港以外</label>' : ''}
    ${region.recordType === 'person' ? '<label>想照顧的方式<input name="protectionType" placeholder="例如生活費、教育、居所"></label>' : ''}
    ${region.recordType === 'gift' ? '<label>你想支持的方向<select name="cause"><option value="none">我暫時不安排公益遺贈</option><option value="community">社區與照顧</option><option value="environment">環境與動物</option><option value="education">教育與研究</option><option value="other">其他</option></select></label><label>機構或方向（可稍後補）<input name="organisation"></label>' : ''}
    <p id="record-error" class="form-error" role="alert"></p>
    <button type="submit">記下這份安排</button>
  `;
  body.append(form);
  return form;
}
