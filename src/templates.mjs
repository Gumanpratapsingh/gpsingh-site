// Renders the site's HTML from data/profile.json + data/projects.json.
// Every theme shares this markup; themes differ only in CSS.

export const THEMES = [
  { id: 'atomic',    label: 'Atomic Diner' },
  { id: 'gazette',   label: 'Gazette' },
  { id: 'punchcard', label: 'Punch-card' },
  { id: 'pulp',      label: 'Pulp Sci-Fi' },
  { id: 'mcm',       label: 'Mid-Century Modern' },
  { id: 'blueprint', label: 'Blueprint' },
  { id: 'swiss',     label: 'Swiss / Intl Style' },
  { id: 'eames',     label: 'Eames Warm' },
  { id: 'bass',      label: 'Saul Bass' },
];

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY',
                'AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];

export function longDate(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return String(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function head({ title, description, theme, preview, depth }) {
  const up = '../'.repeat(depth);
  const css = preview
    ? THEMES.map((t) => `  <link rel="stylesheet" href="${up}assets/css/theme-${t.id}.css">`).join('\n')
    : `  <link rel="stylesheet" href="${up}assets/css/theme-${theme}.css">`;
  return `<!doctype html>
<html lang="en" data-theme="${esc(theme)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Pacifico&family=Work+Sans:ital,wght@0,400;0,600;0,700;1,400&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Oswald:wght@400;600&family=IBM+Plex+Mono:ital,wght@0,400;0,600;0,700;1,400&family=Bungee&family=Josefin+Sans:wght@400;600;700&family=Inter:wght@400;500;700;900&family=Anton&display=swap" rel="stylesheet">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ctext y='26' font-size='26'%3E%E2%98%85%3C/text%3E%3C/svg%3E">
  <link rel="stylesheet" href="${up}assets/css/base.css">
${css}
</head>
<body class="theme-${esc(theme)}">`;
}

function nav(depth, active) {
  const up = '../'.repeat(depth);
  const item = (href, label, id) =>
    `<a class="nav__link${active === id ? ' is-active' : ''}" href="${up}${href}">${esc(label)}</a>`;
  return `<nav class="nav" aria-label="Primary">
      ${item('index.html#about', 'About', 'about')}
      ${item('index.html#projects', 'Projects', 'projects')}
      ${item('index.html#resume', 'Résumé', 'resume')}
      ${item('index.html#contact', 'Contact', 'contact')}
    </nav>`;
}

function masthead(profile, depth, active) {
  return `<header class="masthead">
    <div class="masthead__rule masthead__rule--top" aria-hidden="true"></div>
    <p class="masthead__kicker">${esc(profile.kicker)}</p>
    <a class="masthead__name" href="${'../'.repeat(depth)}index.html">${esc(profile.shortName || profile.name)}</a>
    <p class="masthead__tagline">${esc(profile.tagline)}</p>
    <div class="masthead__rule masthead__rule--bottom" aria-hidden="true"></div>
    ${nav(depth, active)}
  </header>`;
}

function ornament() {
  return `<div class="ornament" aria-hidden="true"><span></span><b>&#9733;</b><span></span></div>`;
}

function projectCard(p, depth) {
  const up = '../'.repeat(depth);
  const tags = (p.tags || []).map((t) => `<li class="tag">${esc(t)}</li>`).join('');
  const status = p.status ? `<span class="stamp stamp--${esc(String(p.status).replace(/\s+/g, '-'))}">${esc(p.status)}</span>` : '';
  return `<li class="card">
      <div class="card__head">
        <span class="card__no">No. ${esc(p.no)}</span>
        <time class="card__date" datetime="${esc(p.date)}">${esc(longDate(p.date))}</time>
      </div>
      <h3 class="card__title"><a href="${up}projects/${esc(p.slug)}/index.html">${esc(p.title)}</a></h3>
      ${status}
      <p class="card__blurb">${esc(p.blurb)}</p>
      <ul class="tags">${tags}</ul>
      <a class="card__more" href="${up}projects/${esc(p.slug)}/index.html">Read the full account <span aria-hidden="true">&rarr;</span></a>
    </li>`;
}

function footer(profile) {
  const year = new Date().getUTCFullYear();
  return `<footer class="colophon">
    ${ornament()}
    <p>Set in hot metal and served static. &copy; ${year} ${esc(profile.name)}.</p>
  </footer>`;
}

function previewBar(theme) {
  const btns = THEMES.map((t) =>
    `<button type="button" class="tpbar__btn" data-theme="${t.id}">${t.label}</button>`).join('');
  return `<div class="tpbar" role="region" aria-label="Theme preview">
    <span class="tpbar__label">PREVIEW &mdash; pick a look:</span>
    ${btns}
    <span class="tpbar__hint">local only &middot; not shipped</span>
  </div>
  <script>(function(){
    var KEY='gps-theme', body=document.body;
    function set(t){ body.className='theme-'+t; document.documentElement.dataset.theme=t;
      try{localStorage.setItem(KEY,t)}catch(e){}
      document.querySelectorAll('.tpbar__btn').forEach(function(b){
        b.setAttribute('aria-pressed', String(b.dataset.theme===t)); }); }
    var saved=null; try{saved=localStorage.getItem(KEY)}catch(e){}
    set(saved||'${theme}');
    document.addEventListener('click',function(e){
      var b=e.target.closest('.tpbar__btn'); if(b) set(b.dataset.theme); });
  })();</script>`;
}

export function renderIndex({ profile, projects, theme, preview }) {
  const links = profile.links || {};
  const skills = (profile.skills || []).map((s) => `<li class="tag">${esc(s)}</li>`).join('');
  const bio = (profile.bio || []).map((p) => `<p>${esc(p)}</p>`).join('\n        ');
  const cards = projects.map((p) => projectCard(p, 0)).join('\n      ');
  const points = (list) => (list || []).length
    ? `<ul class="job__points">${list.map((pt) => `<li>${esc(pt)}</li>`).join('')}</ul>`
    : '';
  const jobs = (profile.experience || []).map((j) => `<li class="job">
          <h3 class="job__role">${esc(j.role)}</h3>
          <p class="job__org">${esc(j.org)} <span class="job__period">${esc(j.period)}</span></p>
          ${j.note ? `<p class="job__note">${esc(j.note)}</p>` : ''}
          ${points(j.points)}
        </li>`).join('\n        ');
  const schools = (profile.education || []).map((e) => `<li class="job">
          <h3 class="job__role">${esc(e.degree)}</h3>
          <p class="job__org">${esc(e.school)} <span class="job__period">${esc(e.period)}</span></p>
        </li>`).join('\n        ');

  const contactRow = (label, value, href) => href
    ? `<li class="contact__row"><span class="contact__label">${esc(label)}</span><a class="contact__value" href="${esc(href)}">${esc(value)}</a></li>`
    : '';

  return `${head({ title: `${profile.name} — ${profile.tagline}`, description: (profile.bio || [''])[0], theme, preview, depth: 0 })}
${preview ? previewBar(theme) : ''}
<div class="paper">
  ${masthead(profile, 0, 'about')}
  <main>
    <section class="section" id="about">
      <h2 class="section__title">About the proprietor</h2>
      <div class="section__body prose">
        ${bio}
        <ul class="tags tags--skills">${skills}</ul>
      </div>
    </section>

    ${ornament()}

    <section class="section" id="projects">
      <h2 class="section__title">The works</h2>
      <p class="section__lede">Everything below shipped, or at least ran once on a Saturday.</p>
      <ol class="cards">
      ${cards}
      </ol>
    </section>

    ${ornament()}

    <section class="section" id="resume">
      <h2 class="section__title">Particulars &amp; résumé</h2>
      <h3 class="article__subhead">Experience</h3>
      <ul class="jobs">
        ${jobs}
      </ul>
      ${schools ? `<h3 class="article__subhead">Education</h3>
      <ul class="jobs">
        ${schools}
      </ul>` : ''}
      ${links.resume ? `<p class="section__cta"><a class="btn" href="${esc(links.resume)}">Download the full résumé</a></p>` : ''}
    </section>

    ${ornament()}

    <section class="section" id="contact">
      <h2 class="section__title">Correspondence</h2>
      <ul class="contact">
        ${contactRow('E-mail', profile.email, `mailto:${profile.email}`)}
        ${contactRow('LinkedIn', String(links.linkedin || '').replace(/^https?:\/\/(www\.)?/, ''), links.linkedin)}
        ${contactRow('GitHub', String(links.github || '').replace(/^https?:\/\/(www\.)?/, ''), links.github)}
        ${links.twitter ? contactRow('X', String(links.twitter).replace(/^https?:\/\/(www\.)?/, ''), links.twitter) : ''}
      </ul>
    </section>
  </main>
  ${footer(profile)}
</div>
</body>
</html>`;
}

export function renderProject({ profile, project, theme, preview }) {
  const p = project;
  const tags = (p.tags || []).map((t) => `<li class="tag">${esc(t)}</li>`).join('');
  const highlights = (p.highlights || []).map((h) => `<li>${esc(h)}</li>`).join('\n          ');
  const body = String(p.body || '').split(/\n{2,}/).filter(Boolean)
    .map((para) => `<p>${esc(para)}</p>`).join('\n        ');
  const l = p.links || {};

  return `${head({ title: `${p.title} — ${profile.shortName || profile.name}`, description: p.blurb, theme, preview, depth: 2 })}
${preview ? previewBar(theme) : ''}
<div class="paper">
  ${masthead(profile, 2, 'projects')}
  <main>
    <article class="section article">
      <p class="article__dateline">No. ${esc(p.no)} &middot; ${esc(longDate(p.date))}${p.status ? ` &middot; ${esc(p.status)}` : ''}</p>
      <h2 class="section__title">${esc(p.title)}</h2>
      <p class="article__lede">${esc(p.blurb)}</p>
      <ul class="tags">${tags}</ul>
      ${highlights ? `<div class="article__highlights">
        <h3 class="article__subhead">What it does</h3>
        <ul class="bullets">
          ${highlights}
        </ul>
      </div>` : ''}
      ${body ? `<div class="prose">
        <h3 class="article__subhead">How it works</h3>
        ${body}
      </div>` : ''}
      <p class="section__cta">
        ${l.repo ? `<a class="btn" href="${esc(l.repo)}">Source code</a>` : ''}
        ${l.demo ? `<a class="btn btn--ghost" href="${esc(l.demo)}">Live demo</a>` : ''}
      </p>
      <p class="article__back"><a href="../../index.html#projects"><span aria-hidden="true">&larr;</span> Back to all works</a></p>
    </article>
  </main>
  ${footer(profile)}
</div>
</body>
</html>`;
}
