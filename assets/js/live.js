// Fills the live pieces with data from the phone server:
//   /live/status.json  battery, temperature, uptime, pages served (public, coarse)
//   /live/github.json  latest commits from public repos
//   /api/ask           Ask-about-Guman answers (POST)
// Everything degrades quietly: if the phone is unreachable the badge says so.
(function () {
  var script = document.currentScript;
  var ORIGIN = script.dataset.origin;
  var PREVIEW = script.hasAttribute('data-preview');

  function setAll(key, value) {
    document.querySelectorAll('[data-live="' + key + '"]').forEach(function (el) { el.textContent = value; });
  }

  function duration(sec) {
    var d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60);
    return d ? d + 'd ' + h + 'h' : h ? h + 'h ' + m + 'm' : m + 'm';
  }

  function ago(iso) {
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    return s < 3600 ? Math.max(1, Math.round(s / 60)) + ' min ago'
      : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' d ago';
  }

  function getJSON(path) {
    return fetch(ORIGIN + path, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  function loadStatus() {
    getJSON('/live/status.json').then(function (s) {
      var stale = Date.now() / 1000 - s.updated > 600;
      document.documentElement.classList.toggle('lv-offline', stale);
      setAll('battery', s.battery + '%');
      setAll('batteryStatus', String(s.batteryStatus).toLowerCase());
      setAll('temp', s.batteryTempC + '°C');
      setAll('uptime', duration(Date.now() / 1000 - s.upSince));
      setAll('requests', Number(s.requests).toLocaleString());
    }).catch(function () {
      document.documentElement.classList.add('lv-offline');
      ['battery', 'temp', 'uptime', 'requests', 'batteryStatus'].forEach(function (k) { setAll(k, '—'); });
    });
  }

  // One Groq-written line about recent commits; raw commits are never published.
  function loadLately() {
    var els = document.querySelectorAll('[data-live-lately]');
    if (!els.length) return;
    getJSON('/live/now.json').then(function (n) {
      els.forEach(function (el) { el.textContent = 'Lately: ' + n.summary; el.hidden = !n.summary; });
    }).catch(function () {});
  }

  function link(text, href) {
    var a = document.createElement('a');
    a.href = href; a.textContent = text; a.rel = 'noopener';
    return a;
  }

  function loadCommits() {
    if (!document.querySelector('[data-live-commits],[data-live-lastcommit],[data-live-log]')) return;
    getJSON('/live/github.json').then(function (g) {
      var commits = [];
      (g.repos || []).forEach(function (r) {
        (r.commits || []).forEach(function (c) { commits.push({ repo: r.name, msg: c.message, date: c.date, url: c.url }); });
      });
      commits.sort(function (a, b) { return b.date.localeCompare(a.date); });

      document.querySelectorAll('[data-live-commits]').forEach(function (ul) {
        ul.textContent = '';
        commits.slice(0, Number(ul.dataset.liveCommits) || 5).forEach(function (c) {
          var li = document.createElement('li');
          li.className = 'lv-now__item';
          var t = document.createElement('time'); t.textContent = ago(c.date);
          li.append(t, ' ', link(c.msg, c.url), ' ');
          var repo = document.createElement('span'); repo.className = 'lv-muted'; repo.textContent = c.repo;
          li.append(repo);
          ul.append(li);
        });
        if (!commits.length) ul.innerHTML = '<li class="lv-muted">No public commits yet.</li>';
      });
      document.querySelectorAll('[data-live-lastcommit]').forEach(function (el) {
        el.textContent = commits[0] ? 'Last commit ' + ago(commits[0].date) + ': ' + commits[0].msg : '';
      });
      document.querySelectorAll('[data-live-log]').forEach(function (pre) {
        if (pre.dataset.filled) return;
        pre.dataset.filled = '1';
        var lines = commits.slice(0, 5).map(function (c) { return c.date.slice(0, 10) + '  ' + c.repo + ': ' + c.msg; });
        if (lines.length) pre.textContent = pre.textContent + '\n' + lines.join('\n');
      });
    }).catch(function () {
      document.querySelectorAll('[data-live-commits]').forEach(function (ul) {
        ul.innerHTML = '<li class="lv-muted">Commits unavailable right now.</li>';
      });
    });
  }

  function wireAsk() {
    document.querySelectorAll('[data-live-ask]').forEach(function (form) {
      var out = form.nextElementSibling;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var q = form.q.value.trim();
        if (!q) return;
        var btn = form.querySelector('button');
        btn.disabled = true;
        out.hidden = false;
        out.textContent = 'Thinking…';
        var reply = PREVIEW
          ? new Promise(function (res) { setTimeout(function () { res({ answer: 'Preview only: the real answer will come from the phone once the AI endpoint is switched on.' }); }, 600); })
          : fetch(ORIGIN + '/api/ask', {
              method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ q: q }),
            }).then(function (r) {
              return r.json().catch(function () {
                return { error: r.status === 429 ? 'Too many questions at once. Please wait a minute and try again.'
                  : 'The phone did not answer. It may be offline right now.' };
              });
            });
        reply.then(function (d) { out.textContent = d.answer || d.error || 'No answer.'; })
          .catch(function () { out.textContent = 'The phone did not answer. It may be offline right now.'; })
          .finally(function () { btn.disabled = false; });
      });
    });
  }

  // Local preview only: one button row per feature switches which variant shows.
  function wirePreviewBar() {
    var KEY = 'gps-live-variants', chosen = {};
    try { chosen = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
    function apply() {
      document.querySelectorAll('.tpbar--live .tpbar__btn').forEach(function (b) {
        var feature = b.dataset.liveFeature;
        if (!chosen[feature]) chosen[feature] = b.dataset.liveVariant;
        b.setAttribute('aria-pressed', String(chosen[feature] === b.dataset.liveVariant));
      });
      Object.keys(chosen).forEach(function (f) { document.body.dataset['lv' + f[0].toUpperCase() + f.slice(1)] = chosen[f]; });
      try { localStorage.setItem(KEY, JSON.stringify(chosen)); } catch (e) {}
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.tpbar--live .tpbar__btn');
      if (!b) return;
      chosen[b.dataset.liveFeature] = b.dataset.liveVariant;
      apply();
    });
    apply();
  }

  if (PREVIEW) wirePreviewBar();
  loadStatus();
  loadCommits();
  loadLately();
  wireAsk();
  setInterval(loadStatus, 60000);
})();
