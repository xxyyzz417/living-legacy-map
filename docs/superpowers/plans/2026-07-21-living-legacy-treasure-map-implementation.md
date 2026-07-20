# Living Legacy Treasure Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the memorial RPG with a privacy-first, scroll-driven treasure-map journey that helps a Hong Kong user record estate and charitable-giving intentions, save encrypted drafts, and download two PDF summaries.

**Architecture:** Keep GitHub Pages and a static runtime, but split the monolithic HTML into browser-native ES modules with pure state, validation, legal-signal, draft, report, and map-model boundaries. The long-scroll map remains usable without answers; optional drawers collect only user-requested detail. PDF generation and encryption run entirely in the browser, and no personal result is shared by URL.

**Tech Stack:** Semantic HTML, CSS, browser-native ES modules, Web Crypto API, vendored `html2pdf.js`, Node built-in test runner, SVG/WebP visual assets, GitHub Pages.

**Canonical spec:** `docs/superpowers/specs/2026-07-21-living-legacy-treasure-map-design.md`

---

## Locked file structure

- Modify: `index.html` — semantic journey shell, map stage, drawers, import input, report templates.
- Create: `styles.css` — long-scroll layout, map, fog, panels, drawers, print, mobile and reduced-motion rules.
- Create: `src/regions.js` — ordered map region content and camera positions.
- Create: `src/state.js` — state factory, immutable update helpers, totals, flags and report projection.
- Create: `src/map-model.js` — pure region/progress/camera calculations.
- Create: `src/reveal-controller.js` — IntersectionObserver wiring and alternative navigation.
- Create: `src/legal-signals.js` — conditional Hong Kong educational signposts and official-source metadata.
- Create: `src/draft.js` — light draft JSON plus password-encrypted full draft.
- Create: `src/report.js` — personal and solicitor report models and DOM rendering.
- Create: `src/pdf.js` — local PDF downloads through the vendored generator.
- Create: `src/ui.js` — region panel, optional detail drawer, signposts and status rendering.
- Create: `src/app.js` — event wiring and in-memory orchestration only.
- Create: `assets/treasure-map.webp` — text-free main long map.
- Create: `assets/regions/*.webp` — optional consistent scene illustrations.
- Create: `assets/ATTRIBUTION.md` — asset source, licence and generation records.
- Create: `vendor/html2pdf.bundle.min.js` and `vendor/html2pdf.LICENSE` — locally served PDF dependency.
- Create: `tests/state.test.js`, `tests/map-model.test.js`, `tests/legal-signals.test.js`, `tests/draft.test.js`, `tests/report.test.js`.
- Create: `scripts/static-check.mjs` — content/privacy/source checks.
- Create: `package.json` — deterministic test and check commands.
- Create: `README.md` — product, privacy, legal and local-development boundaries.

Do not modify the approved spec during implementation. Do not delete the existing legacy plan; this plan supersedes it for the approved design.

### Task 1: Establish test runner and estate state model

**Files:**
- Create: `package.json`
- Create: `src/state.js`
- Create: `tests/state.test.js`

- [ ] **Step 1: Add the test command**

```json
{
  "name": "living-legacy-treasure-map",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/*.test.js",
    "check": "node scripts/static-check.mjs"
  }
}
```

- [ ] **Step 2: Write failing state tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createJourneyState,
  normaliseAmount,
  estateTotals,
  allocationFlags
} from '../src/state.js';

test('creates an empty local-only journey', () => {
  assert.deepEqual(createJourneyState(), {
    formatVersion: 1,
    currentRegion: 'origin',
    reducedMotion: false,
    regions: {},
    assets: [],
    debts: [],
    people: [],
    gifts: [],
    notes: []
  });
});

test('calculates assets, debts and negative net estate honestly', () => {
  const state = createJourneyState();
  state.assets.push({ id: 'home-1', regionId: 'home', amount: 5000000 });
  state.debts.push({ id: 'loan-1', regionId: 'storms', amount: 6200000 });
  assert.deepEqual(estateTotals(state), {
    assets: 5000000,
    debts: 6200000,
    estimatedNet: -1200000
  });
});

test('rejects invalid amounts instead of silently converting them', () => {
  assert.equal(normaliseAmount('1,200,000'), 1200000);
  assert.equal(normaliseAmount('-1'), null);
  assert.equal(normaliseAmount('abc'), null);
});

test('flags allocations above the estimated net estate', () => {
  const state = createJourneyState();
  state.assets.push({ id: 'cash', regionId: 'vault', amount: 100 });
  state.people.push({ id: 'child', label: '孩子', amount: 80 });
  state.gifts.push({ id: 'education', cause: '教育', amount: 30 });
  assert.ok(allocationFlags(state).some(flag => flag.code === 'over-allocated'));
});
```

- [ ] **Step 3: Run the tests and verify red**

Run: `npm test`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/state.js`.

- [ ] **Step 4: Implement the minimal pure model**

```js
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
```

- [ ] **Step 5: Verify green and commit**

Run: `npm test`

Expected: 4 tests PASS.

```powershell
git add package.json src/state.js tests/state.test.js
git commit -m "feat: add living legacy state model"
```

### Task 2: Define the exact treasure-map route and camera model

**Files:**
- Create: `src/regions.js`
- Create: `src/map-model.js`
- Create: `tests/map-model.test.js`

- [ ] **Step 1: Write failing map-model tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampRegionIndex,
  indexForProgress,
  cameraVariables
} from '../src/map-model.js';

test('maps the top and bottom of the long scroll to route endpoints', () => {
  assert.equal(indexForProgress(0, 11), 0);
  assert.equal(indexForProgress(1, 11), 10);
});

test('clamps alternative navigation', () => {
  assert.equal(clampRegionIndex(-2, 11), 0);
  assert.equal(clampRegionIndex(99, 11), 10);
});

test('creates CSS camera and fog variables', () => {
  assert.deepEqual(cameraVariables({ x: 46, y: 72, scale: 1.4 }), {
    '--camera-x': '46%',
    '--camera-y': '72%',
    '--camera-scale': '1.4',
    '--fog-x': '46%',
    '--fog-y': '72%'
  });
});
```

- [ ] **Step 2: Run red**

Run: `node --test tests/map-model.test.js`

Expected: FAIL because `src/map-model.js` does not exist.

- [ ] **Step 3: Create the exact ordered route**

```js
export const REGIONS = [
  { id: 'origin', name: '我的一生', camera: { x: 50, y: 5, scale: 1.08 }, recordType: null,
    copy: '这些是你一生慢慢累积下来的东西。今天，你可以亲自决定它们将要去哪里。' },
  { id: 'home', name: '家园岛', camera: { x: 30, y: 15, scale: 1.35 }, recordType: 'asset',
    copy: '家不只是一项财产，也可能是某个人未来安心生活的地方。' },
  { id: 'vault', name: '金库港', camera: { x: 68, y: 24, scale: 1.42 }, recordType: 'asset',
    copy: '储蓄与投资，是时间慢慢留下的重量，也可以成为下一段生活的支持。' },
  { id: 'beacon', name: '守护灯塔', camera: { x: 38, y: 34, scale: 1.46 }, recordType: 'asset',
    copy: '保险、强积金和退休权益可能有自己的航道，值得提前看清。' },
  { id: 'enterprise', name: '事业城', camera: { x: 70, y: 44, scale: 1.38 }, recordType: 'asset',
    copy: '一盘生意不只有价格，也承载员工、伙伴和多年建立的关系。' },
  { id: 'keepsakes', name: '珍藏山谷', camera: { x: 28, y: 54, scale: 1.48 }, recordType: 'asset',
    copy: '有些物品的意义不在价钱，而在于你希望谁接住它的故事。' },
  { id: 'overseas', name: '远方群岛', camera: { x: 72, y: 63, scale: 1.32 }, recordType: 'asset',
    copy: '远方的财产可能需要另一张海图，先把它记下，再寻找正确路线。' },
  { id: 'storms', name: '风浪海域', camera: { x: 40, y: 72, scale: 1.42 }, recordType: 'debt',
    copy: '在宝藏送达以前，有些按揭、贷款和责任需要先被处理。' },
  { id: 'village', name: '亲友村落', camera: { x: 67, y: 81, scale: 1.38 }, recordType: 'person',
    copy: '如果有一天你不能再亲自照顾他们，你最希望谁过得安稳？' },
  { id: 'tomorrow', name: '明日大陆', camera: { x: 32, y: 90, scale: 1.30 }, recordType: 'gift',
    copy: '如果你的遗产可以继续完成一件好事，你希望世界发生什么变化？' },
  { id: 'destination', name: '我的方向', camera: { x: 50, y: 97, scale: 1.06 }, recordType: null,
    copy: '你已经把最重要的方向说出来了，其余的地方可以慢慢补充。' }
];
```

- [ ] **Step 4: Implement pure map helpers**

```js
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
```

- [ ] **Step 5: Verify and commit**

Run: `npm test`

Expected: 7 tests PASS.

```powershell
git add src/regions.js src/map-model.js tests/map-model.test.js
git commit -m "feat: define living legacy treasure route"
```

### Task 3: Replace the memorial RPG with the semantic long-scroll shell

**Files:**
- Modify: `index.html`
- Create: `styles.css`
- Create: `src/app.js`
- Create: `src/ui.js`

- [ ] **Step 1: Save a pre-change wording check**

Run: `rg -n "先人|生前|大亨|RPG|社会影响力指数|永久冠名|彩带" index.html`

Expected: matches are present, proving the old experience is still in place.

- [ ] **Step 2: Replace `index.html` with the semantic contract**

The body must contain this exact structural contract; region sentinels are generated by `app.js` from `REGIONS`.

```html
<a class="skip-link" href="#journey-copy">跳到旅程内容</a>
<header class="site-header">
  <a class="brand" href="#top">明日藏宝图</a>
  <div class="header-actions">
    <button id="motion-toggle" type="button">减少动画</button>
    <button id="import-trigger" type="button">继续我的旅程</button>
    <input id="draft-file" type="file" accept="application/json,.legacy-map" hidden>
  </div>
</header>
<main id="top">
  <section id="map-stage" aria-labelledby="region-title">
    <div id="map-camera" aria-hidden="true">
      <img id="map-art" src="assets/treasure-map.webp" alt="">
      <div id="fog-layer"></div>
      <div id="route-glow"></div>
    </div>
    <article id="journey-copy" class="region-panel">
      <p id="region-eyebrow">你的旅程</p>
      <h1 id="region-title"></h1>
      <p id="region-copy"></p>
      <div id="region-actions"></div>
      <div id="legal-signpost"></div>
    </article>
    <nav class="map-controls" aria-label="地图路线">
      <button id="previous-region" type="button">上一处</button>
      <p id="map-status" role="status" aria-live="polite"></p>
      <button id="next-region" type="button">下一处</button>
    </nav>
  </section>
  <div id="scroll-route" aria-hidden="true"></div>
  <section id="destination-actions" hidden>
    <button id="download-light-draft" type="button">下载轻量草稿</button>
    <button id="download-full-draft" type="button">下载完整加密草稿</button>
    <button id="download-personal-pdf" type="button">下载我的心愿地图 PDF</button>
    <button id="download-solicitor-pdf" type="button">下载给律师看的 PDF</button>
    <button id="clear-data" type="button">清除所有资料</button>
  </section>
</main>
<dialog id="record-dialog" aria-labelledby="record-title">
  <form method="dialog"><button value="cancel">关闭</button></form>
  <h2 id="record-title"></h2>
  <div id="record-body"></div>
</dialog>
<section id="personal-report" class="report-template" aria-label="我的心愿地图"></section>
<section id="solicitor-report" class="report-template" aria-label="给香港律师看的资料"></section>
<script src="vendor/html2pdf.bundle.min.js"></script>
<script type="module" src="src/app.js"></script>
```

- [ ] **Step 3: Add base CSS with graceful fallback**

```css
:root { --ink:#f5ead1; --dim:#c7baa0; --gold:#dfbd72; --night:#0c1421; }
* { box-sizing:border-box; }
html { scroll-behavior:smooth; }
body { margin:0; color:var(--ink); background:var(--night); font:18px/1.7 "Noto Serif TC","Microsoft JhengHei",serif; }
.skip-link { position:fixed; left:1rem; top:-5rem; z-index:100; }
.skip-link:focus { top:1rem; }
#map-stage { position:sticky; top:0; min-height:100svh; overflow:hidden; }
#map-camera { position:absolute; inset:0; transform-origin:center; transition:transform 900ms ease; }
#map-art { width:100%; height:100%; object-fit:cover; }
#fog-layer { position:absolute; inset:0; pointer-events:none; background:radial-gradient(circle at var(--fog-x) var(--fog-y), transparent 0 14%, rgba(24,20,16,.58) 28%, rgba(10,12,16,.94) 66%); }
.region-panel { position:absolute; z-index:3; left:clamp(1rem,6vw,5rem); bottom:7rem; max-width:42rem; padding:1.5rem; border:1px solid #dfbd7255; border-radius:1rem; background:#0c1421dc; }
#scroll-route { position:relative; z-index:4; pointer-events:none; }
.scroll-sentinel { height:95svh; }
.report-template { display:none; color:#21190f; background:#fff; }
button { min-height:48px; font:inherit; }
@media (max-width:720px) { .region-panel { left:1rem; right:1rem; bottom:5.5rem; max-height:55svh; overflow:auto; } }
@media (prefers-reduced-motion:reduce) { *,*::before,*::after { scroll-behavior:auto!important; transition-duration:.01ms!important; animation-duration:.01ms!important; } }
```

- [ ] **Step 4: Add the first renderer**

```js
import { REGIONS } from './regions.js';

export function renderRegionPanel(region, regionState = {}) {
  document.querySelector('#region-title').textContent = region.name;
  document.querySelector('#region-copy').textContent = region.copy;
  document.querySelector('#region-eyebrow').textContent = regionState.status === 'planned'
    ? '已记下心愿' : regionState.status === 'relevant' ? '这与你有关' : '已探索';
}
```

- [ ] **Step 5: Verify shell and commit**

Run: `python -m http.server 8000`

Expected: `http://localhost:8000` shows the origin panel, all controls are keyboard reachable, and `rg -n "先人|生前|大亨|RPG|社会影响力指数|永久冠名|彩带" index.html` returns no matches.

```powershell
git add index.html styles.css src/app.js src/ui.js
git commit -m "feat: replace memorial game with map shell"
```

### Task 4: Implement scroll reveals, fog camera and alternative navigation

**Files:**
- Create: `src/reveal-controller.js`
- Modify: `src/app.js`
- Modify: `src/ui.js`
- Modify: `styles.css`

- [ ] **Step 1: Generate the eleven sentinels in `app.js`**

```js
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
```

- [ ] **Step 2: Implement one navigation authority**

```js
import { clampRegionIndex, cameraVariables } from './map-model.js';

export function createRevealController({ regions, onChange }) {
  let index = 0;
  const markers = [...document.querySelectorAll('.scroll-sentinel')];

  function goTo(nextIndex, { scroll = false } = {}) {
    index = clampRegionIndex(nextIndex, regions.length);
    const region = regions[index];
    const camera = document.querySelector('#map-camera');
    const fog = document.querySelector('#fog-layer');
    for (const [name, value] of Object.entries(cameraVariables(region.camera))) {
      (name.startsWith('--fog') ? fog : camera).style.setProperty(name, value);
    }
    camera.style.transform = `translate(calc(50% - var(--camera-x)), calc(50% - var(--camera-y))) scale(var(--camera-scale))`;
    onChange(region, index);
    if (scroll) markers[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) goTo(Number(visible.target.dataset.regionIndex));
  }, { threshold: [0.55, 0.75] });
  markers.forEach(marker => observer.observe(marker));
  return { goTo, next: () => goTo(index + 1, { scroll:true }), previous: () => goTo(index - 1, { scroll:true }) };
}
```

- [ ] **Step 3: Wire mouse-independent controls**

In `app.js`, wire previous/next buttons and ArrowUp/ArrowDown only when focus is not inside an input, textarea, select or dialog. Never prevent wheel or touch scrolling.

```js
const controller = createRevealController({
  regions: REGIONS,
  onChange(region) {
    state.currentRegion = region.id;
    state.regions[region.id] ??= { status:'explored' };
    renderRegionPanel(region, state.regions[region.id]);
    document.querySelector('#map-status').textContent = `已抵达：${region.name}`;
    document.querySelector('#destination-actions').hidden = region.id !== 'destination';
  }
});
document.querySelector('#next-region').addEventListener('click', controller.next);
document.querySelector('#previous-region').addEventListener('click', controller.previous);
```

- [ ] **Step 4: Add reduced-motion behavior**

The manual toggle sets `state.reducedMotion`, toggles `document.documentElement.dataset.motion`, and changes its accessible label. CSS for `[data-motion="reduced"]` must remove camera/fog transitions without hiding content.

- [ ] **Step 5: Browser verify and commit**

Expected: continuous wheel/touch scroll reveals all eleven regions; buttons and keyboard reach the same regions; no answer is required; reduced motion keeps the same route.

```powershell
git add src/reveal-controller.js src/app.js src/ui.js styles.css
git commit -m "feat: add scroll-driven fog journey"
```

### Task 5: Add three-depth map participation and optional detail drawers

**Files:**
- Modify: `src/state.js`
- Modify: `src/ui.js`
- Modify: `src/app.js`
- Modify: `tests/state.test.js`

- [ ] **Step 1: Add failing region-state tests**

```js
import { setRegionStatus, upsertRecord } from '../src/state.js';

test('tracks explored, relevant and planned without completion pressure', () => {
  let state = createJourneyState();
  state = setRegionStatus(state, 'home', 'relevant');
  state = setRegionStatus(state, 'home', 'planned');
  assert.equal(state.regions.home.status, 'planned');
});

test('upserts one record without duplicating it', () => {
  let state = createJourneyState();
  state = upsertRecord(state, 'assets', { id:'home-1', regionId:'home', amount:10 });
  state = upsertRecord(state, 'assets', { id:'home-1', regionId:'home', amount:20 });
  assert.equal(state.assets.length, 1);
  assert.equal(state.assets[0].amount, 20);
});
```

- [ ] **Step 2: Run red**

Run: `node --test tests/state.test.js`

Expected: FAIL because `setRegionStatus` and `upsertRecord` are missing.

- [ ] **Step 3: Implement immutable helpers**

```js
export function setRegionStatus(state, regionId, status) {
  return { ...state, regions: { ...state.regions, [regionId]: { ...(state.regions[regionId] ?? {}), status } } };
}

export function upsertRecord(state, collection, record) {
  const records = state[collection];
  const index = records.findIndex(item => item.id === record.id);
  const next = index < 0 ? [...records, record] : records.map((item, i) => i === index ? { ...item, ...record } : item);
  return { ...state, [collection]: next };
}
```

- [ ] **Step 4: Render the exact three choices**

For each non-terminal region, `renderRegionPanel` displays:

```html
<button data-action="continue">只是看看</button>
<button data-action="relevant">这与我有关</button>
<button data-action="plan">我想安排这里</button>
```

`relevant` lights the region without opening a form. `plan` opens the native dialog. The dialog asks one step at a time and always offers “稍后补充”. Asset records support category, label, amount status (`unknown|estimated|exact`), amount, joint, mortgage, overseas and intended destination. Debt, person and gift schemas must match the canonical spec.

- [ ] **Step 5: Preserve input on validation errors**

On invalid amount, set an inline text error and do not close/reset the dialog. On valid or deferred input, save via `upsertRecord`, set region to `planned`, close, restore focus to the region action button, and retain scroll position.

- [ ] **Step 6: Verify and commit**

Run: `npm test`

Expected: all tests PASS. Browser check all three participation depths for home, debt, person and gift.

```powershell
git add src/state.js src/ui.js src/app.js tests/state.test.js
git commit -m "feat: add optional map planning drawers"
```

### Task 6: Add source-verified Hong Kong legal signposts

**Files:**
- Create: `src/legal-signals.js`
- Create: `tests/legal-signals.test.js`
- Modify: `src/ui.js`
- Modify: `src/state.js`

- [ ] **Step 1: Research only official sources**

Verify each shipped statement against official current material. Start with:

- Wills Ordinance (Cap. 30): `https://www.elegislation.gov.hk/hk/cap30`
- Probate and Administration Ordinance (Cap. 10): `https://www.elegislation.gov.hk/hk/cap10`
- Intestates' Estates Ordinance (Cap. 73): `https://www.elegislation.gov.hk/hk/cap73`
- Inheritance (Provision for Family and Dependants) Ordinance (Cap. 481): `https://www.elegislation.gov.hk/hk/cap481`
- MPFA official website: `https://www.mpfa.org.hk/`
- Hong Kong Judiciary Probate Registry: `https://www.judiciary.hk/`

Record exact source title, final URL, verification date and the narrow proposition it supports in the source object. Delete any statement that cannot be confirmed; do not substitute a law-firm marketing article.

- [ ] **Step 2: Write failing conditional tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createJourneyState } from '../src/state.js';
import { signalsForState } from '../src/legal-signals.js';

test('shows joint-property signpost only when relevant', () => {
  const state = createJourneyState();
  assert.equal(signalsForState(state).some(item => item.id === 'joint-assets'), false);
  state.assets.push({ id:'home', regionId:'home', joint:true });
  assert.equal(signalsForState(state).some(item => item.id === 'joint-assets'), true);
});

test('every shipped signpost has a dated official source', () => {
  const state = createJourneyState();
  state.assets.push({ id:'home', regionId:'home', joint:true, overseas:true });
  for (const signal of signalsForState(state)) {
    assert.match(signal.sourceUrl, /^https:\/\//);
    assert.match(signal.verifiedOn, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(signal.lawyerQuestion.endsWith('？'));
  }
});
```

- [ ] **Step 3: Implement the legal-signal contract**

```js
export function signalsForState(state) {
  return LEGAL_SIGNALS.filter(signal => signal.when(state));
}

const LEGAL_SIGNALS = [
  {
    id: 'joint-assets',
    when: state => state.assets.some(item => item.joint),
    title: '联名财产可能有另一条路线',
    summary: '联名财产如何转移与持有方式有关，先记下愿望，再请香港律师确认正确路径。',
    lawyerQuestion: '这项联名财产会否进入我的遗产，以及需要怎样安排？',
    sourceName: '香港司法机构：遗产承办处',
    sourceUrl: 'https://www.judiciary.hk/zh/court_services_facilities/prob.html',
    verifiedOn: '2026-07-21'
  }
];
```

Before committing, open every cited official page and confirm that it supports the narrow wording. If a source does not support its wording, remove that signpost. The dated-source unit test must pass for every remaining record.

- [ ] **Step 4: Render short signposts, not a legal chapter**

The region displays title, summary and “为什么？”. Expansion shows `lawyerQuestion`, source name, official link and verification date. The final solicitor report lists only signals triggered by user data.

- [ ] **Step 5: Verify and commit**

Run: `npm test`

Expected: all tests PASS and the sentinel scan returns no matches.

```powershell
git add src/legal-signals.js src/ui.js src/state.js tests/legal-signals.test.js
git commit -m "feat: add contextual Hong Kong signposts"
```

### Task 7: Add light drafts and password-encrypted full drafts

**Files:**
- Create: `src/draft.js`
- Create: `tests/draft.test.js`
- Modify: `src/app.js`

- [ ] **Step 1: Write red draft tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createJourneyState } from '../src/state.js';
import { lightDraft, encryptFullDraft, decryptFullDraft, parseLightDraft } from '../src/draft.js';

globalThis.crypto ??= webcrypto;

test('light draft excludes amounts but keeps journey direction', () => {
  const state = createJourneyState();
  state.assets.push({ id:'home', regionId:'home', amount:9000000, destination:'伴侣' });
  const parsed = parseLightDraft(lightDraft(state));
  assert.equal(parsed.assets[0].amount, undefined);
  assert.equal(parsed.assets[0].destination, '伴侣');
});

test('full encrypted draft round-trips with the password', async () => {
  const state = createJourneyState();
  state.assets.push({ id:'cash', regionId:'vault', amount:123456 });
  const encrypted = await encryptFullDraft(state, 'correct horse battery staple');
  const restored = await decryptFullDraft(encrypted, 'correct horse battery staple');
  assert.equal(restored.assets[0].amount, 123456);
  await assert.rejects(() => decryptFullDraft(encrypted, 'wrong password'), /密码|读取/);
});
```

- [ ] **Step 2: Run red**

Run: `node --test tests/draft.test.js`

Expected: FAIL because `src/draft.js` does not exist.

- [ ] **Step 3: Implement versioned light drafts**

```js
const FORMAT = 'living-legacy-map';
const VERSION = 1;

function envelope(kind, state) { return { format:FORMAT, version:VERSION, kind, state }; }
function parseEnvelope(text, kind) {
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('草稿文件无法读取。'); }
  if (value?.format !== FORMAT || value.version !== VERSION || value.kind !== kind || !value.state) {
    throw new Error('这不是可使用的明日藏宝图草稿。');
  }
  return value;
}

export function lightDraft(state) {
  const scrub = item => { const { amount, ...safe } = item; return safe; };
  return JSON.stringify(envelope('light', {
    ...state,
    assets: state.assets.map(scrub),
    debts: state.debts.map(scrub),
    people: state.people.map(scrub),
    gifts: state.gifts.map(scrub)
  }), null, 2);
}
export function parseLightDraft(text) { return parseEnvelope(text, 'light').state; }
```

- [ ] **Step 4: Implement AES-GCM + PBKDF2 full drafts**

Use 16 random salt bytes, 12 random IV bytes, SHA-256 PBKDF2 with 250,000 iterations, AES-GCM 256-bit, and base64 fields.

```js
const enc = new TextEncoder();
const dec = new TextDecoder();
const bytesToB64 = bytes => btoa(String.fromCharCode(...bytes));
const b64ToBytes = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));

async function deriveKey(password, salt) {
  const material = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name:'PBKDF2', hash:'SHA-256', salt, iterations:250000 },
    material,
    { name:'AES-GCM', length:256 },
    false,
    ['encrypt','decrypt']
  );
}

export async function encryptFullDraft(state, password) {
  if (password.length < 12) throw new Error('密码至少需要12个字符。');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const plaintext = enc.encode(JSON.stringify(envelope('full', state)));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, plaintext));
  return JSON.stringify({ format:FORMAT, version:VERSION, kind:'encrypted-full', salt:bytesToB64(salt), iv:bytesToB64(iv), ciphertext:bytesToB64(ciphertext) });
}

export async function decryptFullDraft(text, password) {
  try {
    const payload = JSON.parse(text);
    if (payload.format !== FORMAT || payload.kind !== 'encrypted-full') throw new Error();
    const salt = b64ToBytes(payload.salt); const iv = b64ToBytes(payload.iv);
    const key = await deriveKey(password, salt);
    const plaintext = await crypto.subtle.decrypt({ name:'AES-GCM', iv }, key, b64ToBytes(payload.ciphertext));
    return parseEnvelope(dec.decode(plaintext), 'full').state;
  } catch { throw new Error('密码不正确，或完整草稿无法读取。'); }
}
```

- [ ] **Step 5: Wire local download/import**

Use `Blob`, `URL.createObjectURL`, and a temporary `<a download>`. Never write state to URL, localStorage, sessionStorage or a server. Full export requires two matching password entries and the warning “忘记密码后无法恢复完整草稿”. Import validates into a temporary object before replacing current state.

- [ ] **Step 6: Verify and commit**

Run: `npm test`

Expected: all tests PASS, including wrong-password rejection.

```powershell
git add src/draft.js src/app.js tests/draft.test.js
git commit -m "feat: add private encrypted drafts"
```

### Task 8: Build personal and solicitor report models

**Files:**
- Create: `src/report.js`
- Create: `tests/report.test.js`
- Modify: `src/state.js`
- Modify: `src/ui.js`
- Modify: `index.html`

- [ ] **Step 1: Write red report tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createJourneyState } from '../src/state.js';
import { personalReportModel, solicitorReportModel } from '../src/report.js';

test('personal model hides exact amounts by default', () => {
  const state = createJourneyState();
  state.assets.push({ id:'home', label:'我的家', amount:8000000, destination:'伴侣' });
  assert.equal(JSON.stringify(personalReportModel(state)).includes('8000000'), false);
});

test('solicitor model includes details and non-will disclaimer', () => {
  const state = createJourneyState();
  state.assets.push({ id:'home', label:'我的家', amount:8000000, destination:'伴侣' });
  const model = solicitorReportModel(state, []);
  assert.equal(model.assets[0].amount, 8000000);
  assert.match(model.disclaimer, /不是遗嘱|没有法律效力/);
});
```

- [ ] **Step 2: Run red**

Run: `node --test tests/report.test.js`

Expected: FAIL because `src/report.js` does not exist.

- [ ] **Step 3: Implement two explicit projections**

```js
import { estateTotals, allocationFlags } from './state.js';

const DISCLAIMER = '这是一份意愿整理资料，不是遗嘱，也没有法律效力。请让香港执业律师根据你的情况确认正式安排。';

export function personalReportModel(state, { includeAmounts = false } = {}) {
  const hide = item => includeAmounts ? { ...item } : (({ amount, ...rest }) => rest)(item);
  return {
    title:'我的心愿地图', disclaimer:DISCLAIMER,
    regions:state.regions,
    assets:state.assets.map(hide), debts:state.debts.map(hide),
    people:state.people.map(hide), gifts:state.gifts.map(hide), notes:state.notes,
    undecided:Object.entries(state.regions).filter(([, value]) => value.status !== 'planned').map(([id]) => id)
  };
}

export function solicitorReportModel(state, legalSignals) {
  return {
    title:'给香港律师看的遗产与公益遗赠意愿资料', disclaimer:DISCLAIMER,
    totals:estateTotals(state), flags:allocationFlags(state),
    assets:state.assets, debts:state.debts, people:state.people, gifts:state.gifts,
    notes:state.notes,
    lawyerQuestions:legalSignals.map(signal => ({ question:signal.lawyerQuestion, source:signal.sourceName, url:signal.sourceUrl, verifiedOn:signal.verifiedOn }))
  };
}
```

- [ ] **Step 4: Render semantic report DOM**

`renderReport(model, root)` must use headings, definition lists and tables; text must be assigned with `textContent`, never interpolated into `innerHTML`. Every page starts with title and disclaimer. The personal version includes a checkbox outside the report to opt into exact amounts; default is off.

- [ ] **Step 5: Verify and commit**

Run: `npm test`

Expected: all tests PASS.

```powershell
git add src/report.js src/state.js src/ui.js index.html tests/report.test.js
git commit -m "feat: add two-level intention reports"
```

### Task 9: Add direct local PDF downloads

**Files:**
- Modify: `package.json`
- Create: `vendor/html2pdf.bundle.min.js`
- Create: `vendor/html2pdf.LICENSE`
- Create: `src/pdf.js`
- Modify: `src/app.js`
- Modify: `styles.css`

- [ ] **Step 1: Vendor a fixed PDF dependency**

Run: `npm install --save-dev html2pdf.js@0.10.3`

Run: `New-Item -ItemType Directory -Force vendor`

Run: `Copy-Item node_modules\html2pdf.js\dist\html2pdf.bundle.min.js vendor\html2pdf.bundle.min.js`

Run: `Copy-Item node_modules\html2pdf.js\LICENSE vendor\html2pdf.LICENSE`

Expected: the website loads the checked-in bundle locally; no CDN request occurs.

- [ ] **Step 2: Implement PDF export with a print fallback**

```js
export async function downloadReportPdf(root, filename) {
  if (!globalThis.html2pdf) {
    root.dataset.printTarget = 'true';
    window.print();
    delete root.dataset.printTarget;
    return { fallback:true };
  }
  const options = {
    margin:[10,10,12,10], filename,
    image:{ type:'jpeg', quality:.96 },
    html2canvas:{ scale:2, useCORS:false, backgroundColor:'#ffffff' },
    jsPDF:{ unit:'mm', format:'a4', orientation:'portrait' },
    pagebreak:{ mode:['css','legacy'] }
  };
  await globalThis.html2pdf().set(options).from(root).save();
  return { fallback:false };
}
```

- [ ] **Step 3: Wire the two destination buttons**

Personal filename: `我的心愿地图-YYYY-MM-DD.pdf`. Solicitor filename: `给香港律师看的遗产意愿资料-YYYY-MM-DD.pdf`. Render the correct report immediately before export and clear sensitive report DOM after the download promise resolves.

- [ ] **Step 4: Add report-only CSS**

```css
.pdf-export { display:block!important; width:190mm; padding:12mm; color:#21190f; background:#fff; font-family:"Microsoft JhengHei",sans-serif; }
.pdf-export h1,.pdf-export h2 { break-after:avoid; }
.pdf-export table { width:100%; border-collapse:collapse; }
.pdf-export th,.pdf-export td { border:1px solid #8a7b65; padding:.45rem; vertical-align:top; }
@media print { body>*:not(.report-template[data-print-target="true"]) { display:none!important; } .report-template[data-print-target="true"] { display:block!important; } }
```

- [ ] **Step 5: Verify and commit**

Browser check both buttons download readable A4 PDFs with Traditional Chinese text. Temporarily block the bundle and confirm native print fallback. Confirm network requests do not contain user data.

```powershell
git add package.json package-lock.json vendor src/pdf.js src/app.js styles.css
git commit -m "feat: add local PDF downloads"
```

### Task 10: Generate and integrate the mature treasure-map visual system

**Files:**
- Create: `assets/treasure-map.webp`
- Create: `assets/regions/*.webp`
- Create: `assets/ATTRIBUTION.md`
- Modify: `styles.css`
- Modify: `src/regions.js`

- [ ] **Step 1: Use the image-generation skill with the approved art brief**

Generate a text-free, tall 2:5 parchment map with mature East Asian maritime-chart atmosphere, deep navy night edges, warm parchment centre, restrained gold-ink route, subtle Hong Kong mountain/harbour cues, eleven distinct landmarks in the exact route order, generous empty label space, no skulls, pirates, cartoon treasure, hospital beds, graves or distressed people.

- [ ] **Step 2: Inspect before integration**

Confirm: all landmarks are distinct at 1280px desktop and 390px mobile crops; route order is visually coherent; no baked-in words or pseudo-text; no identifiable real person; file is under 2.5 MB after WebP optimisation.

- [ ] **Step 3: Generate only the required regional scenes**

Create up to four reusable scene illustrations for home/family, accumulated wealth, social causes and dawn destination. Use the same palette, camera language and mature semi-realistic style. Do not create one image per legal concept.

- [ ] **Step 4: Record provenance**

`assets/ATTRIBUTION.md` must list each AI-generated file with generation date and prompt summary. Any downloaded texture must include creator, source URL, exact licence and download date; remove any asset without clear public-domain or CC0 permission.

- [ ] **Step 5: Integrate and commit**

Map labels and interactive hotspots remain HTML. Decorative images use empty `alt`; meaningful scenes use short Chinese alternative text from `regions.js`.

```powershell
git add assets styles.css src/regions.js
git commit -m "feat: add approved treasure-map visuals"
```

### Task 11: Add static privacy, source and wording checks

**Files:**
- Create: `scripts/static-check.mjs`
- Create: `README.md`
- Modify: `index.html`

- [ ] **Step 1: Implement the static guard script**

```js
import { readFile, readdir } from 'node:fs/promises';

const files = ['index.html','styles.css', ...(await readdir('src')).map(name => `src/${name}`)];
const text = (await Promise.all(files.map(file => readFile(file,'utf8')))).join('\n');
const banned = ['先人','生前喜欢','大亨','社会影响力指数','永久冠名'];
for (const term of banned) if (text.includes(term)) throw new Error(`Banned or unresolved term: ${term}`);
const privacyRisks = [/fetch\s*\(/, /XMLHttpRequest/, /localStorage/, /sessionStorage/, /navigator\.sendBeacon/];
for (const pattern of privacyRisks) if (pattern.test(text)) throw new Error(`Unexpected network/persistence API: ${pattern}`);
console.log(`Static checks passed across ${files.length} files.`);
```

- [ ] **Step 2: Write README boundaries**

Document: Hong Kong scope; not a will or legal advice; no account/backend/share link; local in-memory handling; light and encrypted drafts; two PDF outputs; official-source verification; local development and test commands.

- [ ] **Step 3: Run guards and tests**

Run: `npm test`

Expected: all tests PASS.

Run: `npm run check`

Expected: `Static checks passed across ... files.`

- [ ] **Step 4: Commit**

```powershell
git add scripts/static-check.mjs README.md index.html
git commit -m "test: guard privacy and product boundaries"
```

### Task 12: Complete browser acceptance, accessibility and GitHub Pages verification

**Files:**
- Modify only files proven necessary by failing acceptance checks.

- [ ] **Step 1: Run unit and static verification fresh**

Run: `npm test`

Expected: all tests PASS.

Run: `npm run check`

Expected: PASS with no unresolved legal-source sentinel or privacy-risk API.

- [ ] **Step 2: Run desktop no-answer journey**

Serve with `python -m http.server 8000`. In a real browser, scroll from origin to destination without clicking an answer. Expected: all eleven regions reveal, destination actions appear, no dialog blocks movement, no console errors.

- [ ] **Step 3: Run planned journey**

Mark home relevant, add an exact cash amount, add a debt, add one person, decline charitable giving, and reach destination. Expected: map state persists in memory; summaries remain respectful; no charity guilt; solicitor report shows relevant flags only.

- [ ] **Step 4: Run privacy and file round trips**

Export/import a light draft and confirm amounts are absent. Export/import an encrypted draft with the correct password and confirm exact amounts return. Wrong password and corrupt file must fail without overwriting current state. Inspect URL, local/session storage and browser network log: no user data is present or transmitted.

- [ ] **Step 5: Verify both PDFs**

Download personal PDF with default hidden amounts and solicitor PDF with exact amounts. Expected: Chinese text is readable, pages are not clipped, disclaimers appear, controls/map are absent, filenames are correct.

- [ ] **Step 6: Verify accessibility and responsive behavior**

Complete the journey at 1280x800 and 390x844. Use keyboard only. Enable browser and in-app reduced motion. Expected: visible focus, meaningful status announcements, buttons at least 44px, no horizontal scroll, no required animation, dialog focus returns correctly.

- [ ] **Step 7: Commit acceptance fixes**

```powershell
git add index.html styles.css src tests scripts README.md assets vendor
git commit -m "fix: complete living legacy acceptance checks"
```

- [ ] **Step 8: Push and verify GitHub Pages**

Run: `git push origin main`

Expected: push succeeds. Verify `https://xxyyzz417.github.io/living-legacy-map/` serves the new journey, downloads both PDFs, exports/imports drafts, and makes no requests containing user input.

## Plan self-review mapping

- Story-first, no-answer long scroll: Tasks 2–4 and 12.
- Three participation depths and exact optional amounts: Tasks 1 and 5.
- Whole estate, people, debts and charitable intent: Tasks 1, 5 and 8.
- Contextual Hong Kong legal education: Task 6.
- Light and encrypted local drafts: Task 7.
- Personal and solicitor PDF downloads: Tasks 8–9.
- Mature AI treasure-map art and licence records: Task 10.
- Privacy, no result link and no cloud storage: Tasks 7, 9, 11 and 12.
- Accessibility, reduced motion and mobile: Tasks 3–4 and 12.
- GitHub Pages release and real-browser verification: Task 12.

No task creates a formal will, provides personal legal conclusions, adds medical/funeral planning, uploads financial data, creates a user account, or generates a personal share link.
