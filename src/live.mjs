// Live pieces fed by the phone server: the "served from a phone" badge, the Now
// section, and the Ask box. Each has several design variants; site.config.json
// picks one per feature for production, and the preview build renders every
// variant so they can be compared with the switcher bar.

export const LIVE_FEATURES = {
  badge: [
    { id: 'strip', label: 'Top strip' },
    { id: 'colophon', label: 'Footer line' },
    { id: 'chip', label: 'Corner chip' },
  ],
  now: [
    { id: 'section', label: 'Full section' },
    { id: 'ticker', label: 'One-liner' },
    { id: 'log', label: 'Changelog' },
  ],
  ask: [
    { id: 'section', label: 'Section' },
    { id: 'floating', label: 'Chat bubble' },
    { id: 'masthead', label: 'Masthead box' },
  ],
};

// Where each variant is placed on the page.
const SLOTS = {
  badge: { strip: 'top', colophon: 'footer', chip: 'floating' },
  now: { section: 'afterAbout', ticker: 'masthead', log: 'afterAbout' },
  ask: { section: 'beforeContact', floating: 'floating', masthead: 'masthead' },
};

export const LIVE_ORIGIN = 'https://site.gumanpratap.workers.dev';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const stat = (key, fallback = '…') => `<span data-live="${key}">${fallback}</span>`;

const BADGE = {
  strip: () => `<div class="lv-strip" role="status">
      <span class="lv-dot" aria-hidden="true"></span>
      <span>Live from a Samsung Galaxy S20 FE</span>
      <span class="lv-strip__stats">Battery ${stat('battery')} &middot; ${stat('temp')} &middot; up ${stat('uptime')} &middot; ${stat('requests')} pages served</span>
    </div>`,
  colophon: () => `<p class="lv-colophon"><span class="lv-dot" aria-hidden="true"></span>
      Served live from a Galaxy S20 FE on a power bank: battery ${stat('battery')}, ${stat('temp')}, up ${stat('uptime')}.</p>`,
  chip: () => `<details class="lv-chip">
      <summary><span class="lv-dot" aria-hidden="true"></span> Served from a phone</summary>
      <dl class="lv-chip__stats">
        <dt>Device</dt><dd>Samsung Galaxy S20 FE</dd>
        <dt>Battery</dt><dd>${stat('battery')} &middot; ${stat('batteryStatus')}</dd>
        <dt>Temperature</dt><dd>${stat('temp')}</dd>
        <dt>Up for</dt><dd>${stat('uptime')}</dd>
        <dt>Pages served</dt><dd>${stat('requests')}</dd>
      </dl>
    </details>`,
};

function nowEntries(entries, limit) {
  return entries.slice(0, limit).map((e) =>
    `<li class="lv-now__item"><time datetime="${esc(e.date)}">${esc(e.date)}</time> <span>${esc(e.text)}</span></li>`).join('');
}

const NOW = {
  section: (entries) => `<section class="section lv-now" id="now">
      <h2 class="section__title">Now</h2>
      <p class="section__lede">What I'm building this week, and the latest commits, updated live.</p>
      <ul class="lv-now__list">${nowEntries(entries, 5)}</ul>
      <h3 class="article__subhead">Latest commits</h3>
      <ul class="lv-now__commits" data-live-commits="6"><li class="lv-muted">Loading…</li></ul>
    </section>`,
  ticker: (entries) => `<p class="lv-ticker"><b>Now</b>
      <span>${esc((entries[0] || {}).text || 'Building something new.')}</span>
      <span class="lv-ticker__lately" data-live-lately hidden></span></p>`,
  log: (entries) => `<section class="section lv-log" id="now">
      <h2 class="section__title">Changelog</h2>
      <pre class="lv-log__pre" data-live-log>${entries.slice(0, 5).map((e) => `${esc(e.date)}  ${esc(e.text)}`).join('\n')}</pre>
    </section>`,
};

const askForm = (extraClass = '') => `<form class="lv-ask__form ${extraClass}" data-live-ask>
        <label class="lv-sr" for="lv-ask-q">Your question</label>
        <input id="lv-ask-q" name="q" type="text" maxlength="300" required autocomplete="off"
          placeholder="e.g. What has Guman built with Twilio?">
        <button class="btn" type="submit">Ask</button>
      </form>
      <div class="lv-ask__answer" aria-live="polite" hidden></div>`;

const ASK = {
  section: () => `<section class="section lv-ask" id="ask">
      <h2 class="section__title">Ask about Guman</h2>
      <p class="section__lede">An AI that has read my résumé and project notes. It only answers questions about my work.</p>
      ${askForm()}
    </section>`,
  floating: () => `<details class="lv-bubble">
      <summary aria-label="Ask about Guman">Ask about me</summary>
      <div class="lv-bubble__panel">
        <p class="lv-bubble__title">Ask about Guman</p>
        ${askForm('lv-ask__form--stack')}
      </div>
    </details>`,
  masthead: () => `<div class="lv-mask">${askForm('lv-ask__form--inline')}</div>`,
};

const RENDER = { badge: BADGE, now: NOW, ask: ASK };

// Returns { top, masthead, afterAbout, beforeContact, footer, floating } HTML strings.
// preview=true renders every variant, each tagged so CSS can show one at a time.
export function renderLive({ choice = {}, preview, now = [] }) {
  const slots = { top: '', masthead: '', afterAbout: '', beforeContact: '', footer: '', floating: '' };
  for (const [feature, variants] of Object.entries(LIVE_FEATURES)) {
    const ids = preview ? variants.map((v) => v.id) : [choice[feature]].filter(Boolean);
    for (const id of ids) {
      const render = RENDER[feature][id];
      if (!render) continue;
      const html = render(now);
      slots[SLOTS[feature][id]] += preview
        ? `<div class="lv-variant" data-feature="${feature}" data-variant="${id}">${html}</div>`
        : html;
    }
  }
  return slots;
}

export function liveScriptTag({ up, preview }) {
  return `<script src="${up}assets/js/live.js" data-origin="${LIVE_ORIGIN}"${preview ? ' data-preview' : ''} defer></script>`;
}

export function livePreviewBar() {
  const groups = Object.entries(LIVE_FEATURES).map(([feature, variants]) =>
    `<span class="tpbar__label">${feature}:</span>` + variants.map((v) =>
      `<button type="button" class="tpbar__btn" data-live-feature="${feature}" data-live-variant="${v.id}">${v.label}</button>`).join('')).join('');
  return `<div class="tpbar tpbar--live" role="region" aria-label="Live feature preview">${groups}</div>`;
}
