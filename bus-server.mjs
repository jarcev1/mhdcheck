// Run with: node bus-server.mjs
// Then open: http://localhost:3000

import http from "http";
import { readFileSync } from "fs";

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDkxNywiaWF0IjoxNzcyODAzNjQxLCJleHAiOjExNzcyODAzNjQxLCJpc3MiOiJnb2xlbWlvIiwianRpIjoiNmEyZWUyMGEtOTBkMy00NDk3LWIzNTEtODgzOGVlMGNjMWZiIn0.eGqe63Kxh05TRDb4umJMtx6WMZBqUcq8V90tMzVpVpg";
const PORT = process.env.PORT || 3000;
const STOPS_DATA = readFileSync(new URL('./stops.json', import.meta.url), 'utf8');

const STOPS = [
  { id: "U930Z2P", label: "Kobrova -> Centrum" },
  { id: "U481Z3P", label: "Švandovo divadlo -> Nahoře" },
  { ids: ["U481Z1P", "U481Z2P", "U481Z3P", "U481Z4P"], label: "Švandovo divadlo" },
  { search: true, label: "🔍 Search" },
  { route: true,  label: "🗺 Route" },
];

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Holečkova MHD odjezdy</title>
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Jost', sans-serif; background: #0a0a0f; color: #e0e0e0; min-height: 100vh; padding: 28px 24px; font-size: 14px; }
  .wrap { max-width: 680px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .clock { font-size: 13px; color: #888; font-variant-numeric: tabular-nums; }
  h1 { font-family: 'Jost', sans-serif; font-size: 28px; font-weight: 800; letter-spacing: -1px; color: #fff; margin-bottom: 20px; }
  .tabs { display: flex; gap: 8px; margin-bottom: 24px; }
  .tab { font-family: 'Jost', sans-serif; font-size: 12px; padding: 8px 18px; border-radius: 8px; border: 1.5px solid #1e1e2e; background: transparent; color: #555; cursor: pointer; transition: all .2s; letter-spacing: 1px; text-transform: uppercase; }
  .tab:hover { border-color: #333; color: #aaa; }
  .tab.active { border-color: #444; background: #16161f; color: #e0e0e0; }
  .stop-id { font-size: 10px; letter-spacing: 3px; color: #444; text-transform: uppercase; margin-bottom: 20px; }
  .status-card { display: flex; align-items: center; gap: 16px; border: 1.5px solid; border-radius: 12px; padding: 18px 22px; margin-bottom: 24px; transition: background .4s, border-color .4s; }
  .dot { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; animation: pulse 2s infinite; }
  .status-label { font-family: 'Jost', sans-serif; font-size: 18px; font-weight: 800; letter-spacing: 1px; margin-bottom: 4px; }
  .status-sub { font-size: 15px; color: #aaa; line-height: 1.6; }
  .delay-badge { display: inline-block; margin-top: 6px; font-size: 10px; background: #ff6b35; color: #fff; padding: 2px 8px; border-radius: 4px; letter-spacing: 1px; }
  .table { border: 1px solid #1e1e2e; border-radius: 10px; overflow: hidden; }
  .table-head, .table-row { display: grid; grid-template-columns: 52px 1fr 72px 90px 72px; gap: 8px; padding: 10px 16px; align-items: center; }
  .table-head { font-size: 11px; letter-spacing: 2px; color: #444; text-transform: uppercase; background: #111118; border-bottom: 1px solid #1e1e2e; }
  .table-row { font-size: 15px; border-bottom: 1px solid #13131f; }
  .mins { font-variant-numeric: tabular-nums; font-weight: 700; white-space: nowrap; }
  .table-row.gone { opacity: 0.4; }
  .table-row.catchable-go  { background: rgba(0,230,118,.07); }
  .table-row.catchable-run { background: rgba(255,106,0,.07); }
  .line-num { font-family: 'Jost', sans-serif; font-weight: 800; font-size: 17px; color: #fff; }
  .headsign { color: #bbb; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dep-time { color: #888; font-variant-numeric: tabular-nums; }
  .on-time { font-size: 10px; color: #444; }
  .late-badge { font-size: 10px; color: #ff6b35; }
  .error-box { background: #2b0d0d; border: 1px solid #ff1744; color: #ff6659; padding: 14px 18px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; }
  .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; font-size: 11px; color: #444; }
  .refresh-btn { background: none; border: 1px solid #2a2a3e; color: #666; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-family: 'Jost', sans-serif; font-size: 11px; }
  .refresh-btn:hover { border-color: #444; color: #aaa; }
  /* Search tab */
  .search-wrap { margin-bottom: 20px; }
  .search-toggle { display:none; background:none; border:1.5px solid #1e1e2e; border-radius:8px; padding:8px 16px; color:#666; font-family:'Jost',sans-serif; font-size:13px; cursor:pointer; margin-bottom:16px; width:100%; text-align:left; }
  .search-wrap.collapsed .search-toggle { display:block; }
  .search-wrap.collapsed .search-input,
  .search-wrap.collapsed .search-results { display:none !important; }
  .search-input { width: 100%; background: #111118; border: 1.5px solid #1e1e2e; border-radius: 8px; padding: 12px 16px; color: #e0e0e0; font-family: 'Jost', sans-serif; font-size: 13px; outline: none; }
  .search-input:focus { border-color: #444; }
  .search-results { margin-top: 8px; border: 1px solid #1e1e2e; border-radius: 10px; overflow: hidden; }
  .search-station { border-bottom: 1px solid #13131f; }
  .search-station-name { padding: 10px 16px; font-family: 'Jost', sans-serif; font-weight: 700; font-size: 14px; color: #fff; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
  .search-station-name:hover { background: #111118; }
  .search-platforms { display: none; padding: 0 16px 12px; }
  .search-station.open .search-platforms { display: block; }
  .search-station.open .search-station-name { color: #aaa; }
  .platform-row { display: flex; align-items: center; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #13131f; font-size: 12px; }
  .platform-row:last-child { border-bottom: none; }
  .platform-id { color: #555; font-size: 10px; letter-spacing: 1px; }
  .platform-dir { color: #888; }
  .platform-check { width: 18px; height: 18px; border-radius: 4px; border: 1.5px solid #333; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .2s; }
  .platform-check.checked { background: #00e676; border-color: #00e676; color: #000; }
  .saved-section { margin-bottom: 24px; }
  .saved-title { font-size: 11px; letter-spacing: 2px; color: #444; text-transform: uppercase; margin-bottom: 10px; }
  .saved-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 1px solid #1e1e2e; border-radius: 8px; margin-bottom: 6px; cursor: pointer; transition: border-color .2s; }
  .saved-item:hover { border-color: #333; }
  .saved-item-label { font-size: 16px; color: #e0e0e0; }
  .saved-item-sub { font-size: 13px; color: #444; margin-top: 3px; }
  .saved-item-del { font-size: 18px; color: #333; cursor: pointer; padding: 0 4px; }
  .saved-item-del:hover { color: #ff1744; }
  .build-btn { width: 100%; margin-top: 16px; padding: 12px; background: #0d2b1a; border: 1.5px solid #00e676; border-radius: 8px; color: #00e676; font-family: 'Jost', sans-serif; font-size: 12px; cursor: pointer; letter-spacing: 1px; }
  .build-btn:disabled { opacity: 0.3; cursor: default; }
  #build-btn { display: none; }
  .live-board { margin-top: 0; }
  .timing-form { display:flex; gap:10px; align-items:center; margin-bottom:16px; flex-wrap:wrap; }
  .timing-form label { font-size:11px; color:#555; letter-spacing:1px; text-transform:uppercase; }
  .timing-input { width:60px; background:#111118; border:1.5px solid #1e1e2e; border-radius:6px; padding:6px 10px; color:#e0e0e0; font-family:'Jost',sans-serif; font-size:13px; text-align:center; outline:none; }
  .timing-input:focus { border-color:#444; }
  .timing-sep { color:#333; font-size:18px; }
  .result-station { padding: 10px 16px; font-size: 14px; color: #e0e0e0; cursor: pointer; border-bottom: 1px solid #13131f; }
  .result-station:hover { background: #111118; }
  .result-station:last-child { border-bottom: none; }
  .status-card .dot { margin-top:3px; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
  @keyframes race {
    0%   { background-position: 0% 0%, 100% 0%, 100% 100%, 0% 100%; }
    100% { background-position: 100% 0%, 100% 100%, 0% 100%, 0% 0%; }
  }
  .status-card.running {
    animation: shake 0.5s ease infinite;
    background-image: linear-gradient(90deg,#ff6a00,#ffaa00,#ff6a00), linear-gradient(180deg,#ff6a00,#ffaa00,#ff6a00), linear-gradient(90deg,#ff6a00,#ffaa00,#ff6a00), linear-gradient(180deg,#ff6a00,#ffaa00,#ff6a00);
    background-size: 50% 2px, 2px 50%, 50% 2px, 2px 50%;
    background-repeat: no-repeat;
    background-position: 0% 0%, 100% 0%, 100% 100%, 0% 100%;
    animation: shake 0.8s ease infinite, race 1s linear infinite;
  }
  .table-row {
    font-size: 15px;
    border-bottom: 1px solid #13131f;
    transition: transform .35s ease, opacity .35s ease, background .35s ease;
  }
  .table-row.enter { opacity:0; transform:translateY(8px); }
  .table-row.enter.show { opacity:1; transform:translateY(0); }
  .next-row {
    background: rgba(0,230,118,.08);
    box-shadow: inset 3px 0 0 #00e676;
  }

</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>Holečkova MHD odjezdy</h1>
    <span class="clock" id="clock"></span>
  </div>

  <div class="tabs" id="tabs"></div>
  <div id="search-panel" style="display:none">
    <div class="search-wrap" id="search-wrap">
      <button class="search-toggle" onclick="expandSearch()">🔍 Search for a stop…</button>
      <input class="search-input" id="search-input" type="text" placeholder="Search for a stop…" oninput="onSearch(this.value)" autocomplete="off">
      <div class="search-results" id="search-results" style="display:none"></div>
    </div>
    <div class="saved-section" id="saved-section" style="display:none">
      <div class="saved-title" onclick="toggleSaved()" style="cursor:pointer;user-select:none;display:flex;justify-content:space-between;align-items:center">
        <span>⭐ Saved stops</span>
        <span id="saved-toggle" style="color:#444;font-size:13px">Hide</span>
      </div>
      <div id="saved-list"></div>
    </div>
    <button class="build-btn" id="build-btn" onclick="buildLiveBoard()" disabled>Show departures for selected platforms</button>
    <div class="live-board" id="live-board"></div>
  </div>
  <div id="route-panel" style="display:none">
    <div style="margin-bottom:16px">
      <div style="font-size:11px;letter-spacing:2px;color:#444;text-transform:uppercase;margin-bottom:8px">From</div>
      <div style="position:relative">
        <input class="search-input" id="route-from-input" type="text" placeholder="Search origin stop…" oninput="onRouteSearch('from',this.value)" autocomplete="off">
        <div class="search-results" id="route-from-results" style="display:none"></div>
      </div>
      <div id="route-from-selected" style="margin-top:6px;padding:8px 12px;background:#111118;border-radius:8px;font-size:13px;color:#00e676;display:none;justify-content:space-between;align-items:center"></div>
    </div>
    <div style="margin-bottom:16px">
      <div style="font-size:11px;letter-spacing:2px;color:#444;text-transform:uppercase;margin-bottom:8px">To</div>
      <div style="position:relative">
        <input class="search-input" id="route-to-input" type="text" placeholder="Search destination stop…" oninput="onRouteSearch('to',this.value)" autocomplete="off">
        <div class="search-results" id="route-to-results" style="display:none"></div>
      </div>
      <div id="route-to-selected" style="margin-top:6px;padding:8px 12px;background:#111118;border-radius:8px;font-size:13px;color:#00e676;display:none;justify-content:space-between;align-items:center"></div>
    </div>
    <button class="build-btn" id="route-btn" onclick="searchRoute()" disabled style="display:none">Open in IDOS →</button>
    <div style="margin-top:8px;font-size:12px;color:#333;text-align:center">Opens pid.idos.cz in a new tab</div>
  </div>
    <div id="status"></div>
  <div id="board"></div>
  <div class="footer">
    <span id="updated">—</span>
    <button class="refresh-btn" onclick="load()">↻ Refresh</button>
  </div>
</div>
<script>
  const WINDOW_RUN_MIN = 1.5;
  const WINDOW_MIN = 2.5;
  const WINDOW_MAX = 4;
  const STOPS = ${JSON.stringify(STOPS)};

  const STOP_LABELS = {
    'U481Z1P': 'North',
    'U481Z2P': 'South',
    'U481Z3P': 'Home',
    'U481Z4P': 'Karlák',
  };

  // Tab 2 (Všechno) only watches North+South, excludes line 176
  const COMBINED_STATUS_STOPS = new Set(['U481Z1P', 'U481Z2P']);
  const COMBINED_EXCLUDE_LINES = new Set(['176']);

  // Tab-specific thresholds for tab 2 (Všechno)
  const TAB_THRESHOLDS = {
    2: { runMin: 4.5, runMax: 5.5, goMin: 5.5, goMax: 7 }
  };

  function getStatus(mins, tabIdx) {
    const t = TAB_THRESHOLDS[tabIdx];
    if (t) {
      if (mins < t.goMin) return 'late';
      if (mins <= t.goMax) return 'go';
      return 'early';
    }
    if (mins < WINDOW_RUN_MIN) return 'late';
    if (mins < WINDOW_MIN) return 'run';
    if (mins <= WINDOW_MAX) return 'go';
    return 'early';
  }
  function statusStyle(st) {
    return { go:    { col:'#00e676', bg:'#0d2b1a', label:'✓ LEAVE NOW' },
             run:   { col:'#ff6a00', bg:'#2b1500', label:'<<< RUN >>>' },
             early: { col:'#ffab00', bg:'#2b2200', label:'◎ TOO EARLY' },
             late:  { col:'#ff1744', bg:'#2b0d0d', label:'✗ TOO LATE' } }[st];
  }

  let activeTab = 0;
  const cache = {};

  function minsUntil(ts) { return (new Date(ts).getTime() - Date.now()) / 60000; }
  function fmt(ts) { return new Date(ts).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }); }
  function fmtCountdown(mins) {
    if (mins <= 0) return 'now';
    const m = Math.floor(mins);
    const s = Math.floor((mins - m) * 60);
    return m > 0 ? \`\${m}m \${String(s).padStart(2,'0')}s\` : \`\${s}s\`;
  }

  function buildTabs() {
    document.getElementById('tabs').innerHTML = STOPS.map((s, i) => {
      const subtitle = (s.search || s.route) ? '' : s.ids ? 'Všechno' : s.id;
      const sub = subtitle ? \`<br><span style="font-size:9px;opacity:.5">\${subtitle}</span>\` : '';
      return \`<button class="tab \${i===activeTab?'active':''}" onclick="switchTab(\${i})">\${s.label}\${sub}</button>\`;
    }).join('');
  }

  function switchTab(i) {
    if (STOPS[activeTab].search) closeSearchTab();
    if (STOPS[activeTab].route)  closeRouteTab();
    activeTab = i;
    buildTabs();
    if (STOPS[i].search) {
      openSearchTab();
    } else if (STOPS[i].route) {
      openRouteTab();
    } else if (cache[i]) {
      fullRender(cache[i]);
    } else {
      load();
    }
  }

  // TICK: every second — patch text in place, no DOM rebuild
  function tick() {
    document.getElementById('clock').textContent = new Date().toLocaleTimeString('cs-CZ');

    // Always update any visible countdown spans
    document.querySelectorAll('[data-ts]').forEach(el => {
      const mins = minsUntil(el.dataset.ts);
      el.textContent = mins < 0 ? 'gone' : fmtCountdown(mins);
    });

    if (STOPS[activeTab].search || STOPS[activeTab].route) return;
    const deps = cache[activeTab];
    if (!deps) return;

    const isCombined = !!STOPS[activeTab].ids;
    const candidates = deps
      .map(d => ({ ...d, ts: d.departure_timestamp?.predicted || d.departure_timestamp?.scheduled }))
      .map(d => ({ ...d, mins: d.ts ? minsUntil(d.ts) : null }))
      .filter(d => d.mins !== null && d.mins >= 0)
      .filter(d => !isCombined || (COMBINED_STATUS_STOPS.has(d.stop?.id) && !COMBINED_EXCLUDE_LINES.has(d.route?.short_name)));

    const next = candidates[0];
    const after = candidates[1];

    const card = document.getElementById('status-card');
    if (!card || !next) return;

    if (isCombined) {
      const t = TAB_THRESHOLDS[activeTab];
      const goGroup  = candidates.filter(d => d.mins >= t.goMin  && d.mins <= t.goMax);
      const runGroup = candidates.filter(d => d.mins >= t.runMin && d.mins <  t.goMin);
      const prevGo  = parseInt(card.dataset.goCount  || '0');
      const prevRun = parseInt(card.dataset.runCount || '0');
      if (goGroup.length !== prevGo || runGroup.length !== prevRun) {
        fullRender(cache[activeTab]);
      }
      return;
    }

    const st = getStatus(next.mins, activeTab);
    const { col, bg, label } = statusStyle(st);
    card.style.background = bg;
    card.style.borderColor = st === 'run' ? 'transparent' : col;
    card.className = 'status-card' + (st === 'run' ? ' running' : '');
    const dot = card.querySelector('.dot');
    dot.style.background = col;
    dot.style.boxShadow = \`0 0 16px \${col}\`;
    const lbl = card.querySelector('.status-label');
    lbl.style.color = col; lbl.textContent = label;
    const cdEl = card.querySelector('.status-countdown');
    cdEl.style.color = col; cdEl.textContent = fmtCountdown(next.mins);

    // Remove the "Next:" line if we've transitioned out of the late state
    const afterEl = card.querySelector('.after-line');
    if (afterEl && st !== 'late') {
      afterEl.remove();
    } else if (!afterEl && st === 'late') {
      // Transitioning into late — find the next bus after this one and inject the line
      if (after) {
        const div = document.createElement('div');
        div.className = 'after-line';
        div.style.cssText = 'margin-top:8px;font-size:15px;color:#888';
        div.innerHTML = \`Next: <strong style="color:#ccc">\${after.route?.short_name}</strong> at <strong style="color:#ccc">\${fmt(after.ts)}</strong> · in <span data-ts="\${after.ts}" style="color:#aaa">\${fmtCountdown(after.mins)}</span>\`;
        card.querySelector('.status-sub').parentNode.appendChild(div);
      }
    }
  }
  setInterval(tick, 1000); tick();

  // FETCH: load active tab's stop from API
  async function load() {
    const stop = STOPS[activeTab];
    if (stop.search || stop.route) return; // these tabs manage their own data
    const stopParam = stop.ids ? stop.ids.join(',') : stop.id;
    try {
      const res = await fetch('/api/departures?stop=' + encodeURIComponent(stopParam));
      if (!res.ok) throw new Error('API error ' + res.status);
      const data = await res.json();
      cache[activeTab] = data.departures || [];
      document.getElementById('updated').textContent = 'Updated ' + new Date().toLocaleTimeString('cs-CZ');
      fullRender(cache[activeTab]);
    } catch(e) {
      document.getElementById('status').innerHTML = '<div class="error-box">⚠ ' + e.message + '</div>';
    }
  }

  // FULL RENDER: builds DOM once per API fetch
  function fullRender(departures) {
    const enriched = departures.map(d => {
      const ts = d.departure_timestamp?.predicted || d.departure_timestamp?.scheduled;
      return { ...d, ts, mins: ts ? minsUntil(ts) : null };
    });

    const isCombined = !!STOPS[activeTab].ids;
    const statusCandidates = isCombined
      ? enriched.filter(d => COMBINED_STATUS_STOPS.has(d.stop?.id) && !COMBINED_EXCLUDE_LINES.has(d.route?.short_name))
      : enriched;

    const upcoming = statusCandidates.filter(d => d.mins !== null && d.mins >= 0);
    const next = upcoming[0];
    const after = upcoming[1];

    if (isCombined) {
      const t = TAB_THRESHOLDS[activeTab];
      const goGroup  = upcoming.filter(d => d.mins >= t.goMin  && d.mins <= t.goMax);
      const runGroup = upcoming.filter(d => d.mins >= t.runMin && d.mins <  t.goMin);
      const hasAny   = goGroup.length > 0 || runGroup.length > 0;

      function busLine(d, col) {
        const dir = STOP_LABELS[d.stop?.id] || d.trip?.headsign || '—';
        return \`<div style="margin-top:6px;font-size:15px;color:#aaa">
          <strong style="color:#fff">\${d.route?.short_name}</strong> → \${dir} in
          <span data-ts="\${d.ts}" style="color:\${col};font-weight:700">\${fmtCountdown(d.mins)}</span>
        </div>\`;
      }

      let cardHtml;
      if (hasAny) {
        const sections = [];
        if (goGroup.length > 0) {
          sections.push(\`
            <div class="status-label" style="color:#00e676">✓ LEAVE NOW</div>
            \${goGroup.map(d => busLine(d, '#00e676')).join('')}\`);
        }
        if (runGroup.length > 0) {
          sections.push(\`
            <div class="status-label" style="color:#ff6a00;margin-top:\${goGroup.length > 0 ? '14px' : '0'}"><<< RUN >>></div>
            \${runGroup.map(d => busLine(d, '#ff6a00')).join('')}\`);
        }
        // Pick border colour: green if any go, orange if only run
        const borderCol = goGroup.length > 0 ? '#00e676' : '#ff6a00';
        const bgCol     = goGroup.length > 0 ? '#0d2b1a' : '#2b1500';
        cardHtml = \`
          <div id="status-card" class="status-card" data-go-count="\${goGroup.length}" data-run-count="\${runGroup.length}" style="background:\${bgCol};border-color:\${borderCol}">
            <div class="dot" style="background:\${borderCol};box-shadow:0 0 16px \${borderCol}"></div>
            <div>\${sections.join('')}</div>
          </div>\`;
      } else if (!next) {
        cardHtml = '';
      } else {
        // Nothing actionable — only show Too Early (no Too Late for tab 3)
        if (next.mins >= t.goMax) {
          const { col, bg, label } = statusStyle('early');
          cardHtml = \`
            <div id="status-card" class="status-card" data-go-count="0" data-run-count="0" style="background:\${bg};border-color:\${col}">
              <div class="dot" style="background:\${col};box-shadow:0 0 16px \${col}"></div>
              <div>
                <div class="status-label" style="color:\${col}">\${label}</div>
                <div style="margin-top:6px;font-size:15px;color:#888">
                  Next: <strong style="color:#ccc">\${next.route?.short_name}</strong> → \${STOP_LABELS[next.stop?.id] || '—'} in
                  <span data-ts="\${next.ts}" style="color:#aaa">\${fmtCountdown(next.mins)}</span>
                </div>
              </div>
            </div>\`;
        } else {
          cardHtml = ''; // < runMin, nothing to show
        }
      }
      document.getElementById('status').innerHTML = cardHtml;

    } else {
      // Tabs 0 & 1: original single-next-bus logic
      if (next) {
        const st = getStatus(next.mins, activeTab);
        const { col, bg, label } = statusStyle(st);
        const isRun = st === 'run';
        const isLate = st === 'late';
        const afterLine = isLate && after
          ? \`<div class="after-line" style="margin-top:8px;font-size:15px;color:#888">Next: <strong style="color:#ccc">\${after.route?.short_name}</strong> at <strong style="color:#ccc">\${fmt(after.ts)}</strong> · in <span data-ts="\${after.ts}" style="color:#aaa">\${fmtCountdown(after.mins)}</span></div>\`
          : '';
        document.getElementById('status').innerHTML = \`
          <div id="status-card" class="status-card\${isRun?' running':''}" style="background:\${bg};border-color:\${isRun?'transparent':col}">
            <div class="dot" style="background:\${col};box-shadow:0 0 16px \${col}"></div>
            <div>
              <div class="status-label" style="color:\${col}">\${label}</div>
              <div class="status-sub">
                Next bus <strong style="color:#fff">\${next.route?.short_name}</strong> in
                <span class="status-countdown" style="font-weight:700;color:\${col}">\${fmtCountdown(next.mins)}</span>
                · departs \${fmt(next.ts)}
              </div>
              \${next.delay?.minutes > 0 ? \`<div class="delay-badge">+\${next.delay.minutes} min delay</div>\` : ''}
              \${afterLine}
            </div>
          </div>\`;
      } else {
        document.getElementById('status').innerHTML = '';
      }
    }

    const rows = enriched.filter(d => d.mins !== null && d.mins >= -1).slice(0, 8).map(d => {
      const gone  = d.mins < 0;
      const t = TAB_THRESHOLDS[activeTab];
      const inGo  = !gone && (t ? (d.mins >= t.goMin  && d.mins <= t.goMax)  : (d.mins >= WINDOW_MIN  && d.mins <= WINDOW_MAX));
      const inRun = !gone && (t ? (d.mins >= t.runMin && d.mins <  t.goMin)  : (d.mins >= WINDOW_RUN_MIN && d.mins < WINDOW_MIN));
      const rowClass = gone ? 'gone' : inGo ? 'catchable-go' : inRun ? 'catchable-run' : '';
      const minCol = gone ? '#888' : inGo ? '#00e676' : inRun ? '#ff6a00' : '#e0e0e0';
      const statusCell = gone ? '' : (d.delay?.is_available && d.delay.minutes > 0)
        ? \`<span class="late-badge">+\${d.delay.minutes}m</span>\`
        : \`<span class="on-time">on time</span>\`;
      const stopId = d.stop?.id;
      const headsign = (STOPS[activeTab].ids && stopId && STOP_LABELS[stopId])
        ? STOP_LABELS[stopId]
        : (d.trip?.headsign || '—');
      return \`<div class="table-row \${rowClass}">
        <span class="line-num">\${d.route?.short_name||'—'}</span>
        <span class="headsign">\${headsign}</span>
        <span class="dep-time">\${d.ts?fmt(d.ts):'—'}</span>
        <span class="mins" style="color:\${minCol}" \${d.ts&&!gone?'data-ts="'+d.ts+'"':''}>\${d.mins!==null?(gone?'gone':fmtCountdown(d.mins)):'—'}</span>
        <span>\${statusCell}</span>
      </div>\`;
    }).join('');

    document.getElementById('board').innerHTML = \`
      <div class="table">
        <div class="table-head"><span>Line</span><span>Direction</span><span>Departs</span><span>In</span><span>Status</span></div>
        \${rows || '<div style="padding:24px;text-align:center;color:#444">No departures found.</div>'}
      </div>\`;

    requestAnimationFrame(() => {
      document.querySelectorAll('.table-row').forEach(r => {
        r.classList.add('enter');
        requestAnimationFrame(()=>r.classList.add('show'));
      });
    });

  }

  buildTabs();
  load();
  setInterval(load, 30000);

  // ── SEARCH TAB ──────────────────────────────────────────────────────────────
  let stopsDb = null;         // loaded once on first open
  let selectedPlatforms = {}; // { id: { stationName, platform, dir } }
  let searchInterval = null;

  async function openSearchTab() {
    document.getElementById('search-panel').style.display = 'block';
    document.getElementById('status').style.display = 'none';
    document.getElementById('board').style.display = 'none';
    document.getElementById('updated').style.display = 'none';
    document.querySelector('.refresh-btn').style.display = 'none';
    if (!stopsDb) {
      const res = await fetch('/api/stops');
      stopsDb = await res.json(); // [[name, lat, lon, [[id, platform, dir], ...]], ...]
    }
    renderSaved();
  }

  function closeSearchTab() {
    document.getElementById('search-panel').style.display = 'none';
    document.getElementById('status').style.display = '';
    document.getElementById('board').style.display = '';
    document.getElementById('updated').style.display = '';
    document.querySelector('.refresh-btn').style.display = '';
    document.getElementById('live-board').innerHTML = '';
    if (searchInterval) { clearInterval(searchInterval); searchInterval = null; }
  }

  // ── ROUTE TAB ────────────────────────────────────────────────────────────────
  let routeFrom = null; // { name, lat, lon }
  let routeTo   = null;

  async function openRouteTab() {
    document.getElementById('route-panel').style.display = 'block';
    document.getElementById('status').style.display = 'none';
    document.getElementById('board').style.display = 'none';
    document.getElementById('updated').style.display = 'none';
    document.querySelector('.refresh-btn').style.display = 'none';
    if (!stopsDb) {
      const res = await fetch('/api/stops');
      stopsDb = await res.json();
    }
  }

  function closeRouteTab() {
    document.getElementById('route-panel').style.display = 'none';
    document.getElementById('status').style.display = '';
    document.getElementById('board').style.display = '';
    document.getElementById('updated').style.display = '';
    document.querySelector('.refresh-btn').style.display = '';
  }

  function onRouteSearch(which, val) {
    const resEl = document.getElementById(\`route-\${which}-results\`);
    const q = norm(val.trim());
    if (q.length < 2) { resEl.style.display = 'none'; return; }
    const matches = stopsDb.filter(s => norm(s[0]).includes(q)).slice(0, 12);
    resEl.style.display = matches.length ? 'block' : 'none';
    resEl.innerHTML = matches.map(([name, lat, lon]) =>
      \`<div class="result-station" data-name="\${name.replace(/"/g,'&quot;')}" data-lat="\${lat}" data-lon="\${lon}" onmousedown="handleRouteStopMousedown(event,'\${which}')">\${name}</div>\`
    ).join('');
  }

  function handleRouteStopMousedown(e, which) {
    e.preventDefault();
    const el = e.currentTarget;
    selectRouteStop(which, el.dataset.name, parseFloat(el.dataset.lat), parseFloat(el.dataset.lon));
  }

  function selectRouteStop(which, name, lat, lon) {
    if (which === 'from') routeFrom = { name, lat, lon };
    else                  routeTo   = { name, lat, lon };

    const inp = document.getElementById(\`route-\${which}-input\`);
    const res = document.getElementById(\`route-\${which}-results\`);
    const sel = document.getElementById(\`route-\${which}-selected\`);
    inp.value = '';
    inp.style.display = 'none';
    res.style.display = 'none';
    sel.style.cssText = 'display:flex;justify-content:space-between;align-items:center';
    sel.innerHTML = \`<span>\${name}</span><button onclick="clearRouteStop('\${which}')" style="background:none;border:none;color:#444;font-size:16px;cursor:pointer;padding:0;line-height:1">✕</button>\`;

    updateRouteBtn();
  }

  function clearRouteStop(which) {
    if (which === 'from') routeFrom = null;
    else                  routeTo   = null;
    document.getElementById(\`route-\${which}-input\`).style.display = '';
    document.getElementById(\`route-\${which}-selected\`).style.display = 'none';
    updateRouteBtn();
  }

  function updateRouteBtn() {
    const btn = document.getElementById('route-btn');
    const ready = !!(routeFrom && routeTo);
    btn.style.display = ready ? 'block' : 'none';
    btn.disabled = !ready;
  }

  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString('cs-CZ', { hour:'2-digit', minute:'2-digit' });
  }

  function fmtDuration(secs) {
    const m = Math.round(secs / 60);
    return m < 60 ? \`\${m} min\` : \`\${Math.floor(m/60)}h \${m%60}m\`;
  }

  function searchRoute() {
    const url = \`https://pid.idos.cz/spojeni/?f=\${encodeURIComponent(routeFrom.name)}&t=\${encodeURIComponent(routeTo.name)}\`;
    window.open(url, '_blank');
  }

  // Saved favourites stored in localStorage
  function getSaved() {
    try { return JSON.parse(localStorage.getItem('saved_stops') || '[]'); } catch { return []; }
  }
  function setSaved(arr) { localStorage.setItem('saved_stops', JSON.stringify(arr)); }

  function renderSaved() {
    const saved = getSaved();
    const section = document.getElementById('saved-section');
    const list = document.getElementById('saved-list');
    if (saved.length === 0) { section.style.display = 'none'; return; }
    section.style.display = 'block';
    list.innerHTML = saved.map((s, i) => {
      const timing = (s.walkMins || s.runMins)
        ? \`🚶 \${s.walkMins||'—'}m · 🏃 \${s.runMins||'—'}m\`
        : 'No timing set';
      return \`<div class="saved-item" onclick="loadSaved(\${i})">
        <div>
          <div class="saved-item-label">\${s.label}</div>
          <div class="saved-item-sub">\${timing}</div>
        </div>
        <span class="saved-item-del" onclick="deleteSaved(event,\${i})">✕</span>
      </div>\`;
    }).join('');
  }

  function deleteSaved(e, i) {
    e.stopPropagation();
    const saved = getSaved();
    saved.splice(i, 1);
    setSaved(saved);
    renderSaved();
  }

  function loadSaved(i) {
    const s = getSaved()[i];
    document.getElementById('live-board').innerHTML = '<div style="padding:20px 0;color:#555;font-size:12px">Loading…</div>';
    // Rebuild selectedPlatforms from saved ids using stopsDb
    selectedPlatforms = {};
    if (stopsDb) {
      for (const [name, , , platforms] of stopsDb) {
        for (const [id, plat, dir] of platforms) {
          if (s.ids.includes(id)) selectedPlatforms[id] = { stationName: name, platform: plat, dir };
        }
      }
    }
    fetchAndRenderLive(s.ids, s.label, s.walkMins || null, s.runMins || null);
  }

  function buildLiveBoard() {
    const ids = Object.keys(selectedPlatforms);
    if (ids.length === 0) return;

    const names = [...new Set(Object.values(selectedPlatforms).map(p => p.stationName))];
    const label = names.join(' + ');
    const saved = getSaved();
    const existingIdx = saved.findIndex(s => s.ids.join(',') === ids.join(','));

    if (existingIdx >= 0) {
      // Already saved — just show live board with existing timing
      const s = saved[existingIdx];
      fetchAndRenderLive(ids, s.label, s.walkMins || null, s.runMins || null);
    } else {
      // Show inline save + timing form
      const liveBoard = document.getElementById('live-board');
      liveBoard.innerHTML = \`
        <div style="background:#111118;border:1px solid #1e1e2e;border-radius:10px;padding:16px;margin-bottom:16px">
          <div style="font-size:11px;letter-spacing:2px;color:#444;text-transform:uppercase;margin-bottom:12px">Save & configure timing</div>
          <input id="save-label-input" style="width:100%;background:#0a0a0f;border:1.5px solid #1e1e2e;border-radius:6px;padding:8px 12px;color:#e0e0e0;font-family:'Jost',sans-serif;font-size:12px;outline:none;margin-bottom:12px" placeholder="Name this stop (e.g. Home → Work)" value="\${label}">
          <div class="timing-form">
            <label>🚶 Walk</label>
            <input class="timing-input" id="walk-input" type="number" min="0" max="30" placeholder="—" title="Minutes to walk to stop">
            <span class="timing-sep">·</span>
            <label>🏃 Run</label>
            <input class="timing-input" id="run-input" type="number" min="0" max="30" placeholder="—" title="Minutes to run to stop">
            <span style="font-size:10px;color:#444;margin-left:4px">minutes</span>
          </div>
          <div style="display:flex;gap:8px">
            <button class="build-btn" style="margin-top:0;flex:1" onclick="confirmSaveAndLoad()">Save & show departures</button>
            <button class="build-btn" style="margin-top:0;flex:0;background:transparent;border-color:#333;color:#666" onclick="fetchAndRenderLive(Object.keys(selectedPlatforms), document.getElementById('save-label-input').value, null, null)">Skip →</button>
          </div>
        </div>\`;
    }
  }

  function confirmSaveAndLoad() {
    const ids = Object.keys(selectedPlatforms);
    const label = document.getElementById('save-label-input').value.trim() || 'Unnamed stop';
    const walkMins = parseFloat(document.getElementById('walk-input').value) || null;
    const runMins  = parseFloat(document.getElementById('run-input').value)  || null;
    const saved = getSaved();
    saved.push({ label, ids, walkMins, runMins });
    setSaved(saved);
    renderSaved();
    fetchAndRenderLive(ids, label, walkMins, runMins);
  }

  async function fetchAndRenderLive(ids, label, walkMins, runMins) {
    if (searchInterval) { clearInterval(searchInterval); searchInterval = null; }
    collapseSearch();
    // Hide the "Show departures" button immediately
    const buildBtn = document.getElementById('build-btn');
    buildBtn.style.display = 'none';
    buildBtn.disabled = true;
    const liveBoard = document.getElementById('live-board');
    liveBoard.innerHTML = '<div style="padding:20px 0;color:#555;font-size:12px">Loading…</div>';

    // Build status for a departure given walk/run times
    function getSearchStatus(mins) {
      if (!walkMins) return null;
      // Same logic as tab 1: runMins = bottom of run window, walkMins = bottom of go window
      // goMax defaults to walkMins + 1.5 (same as WINDOW_MAX - WINDOW_MIN gap in tab 1)
      const goMax = walkMins + 1.5;
      if (mins < (runMins != null ? runMins : walkMins)) return 'late';
      if (runMins != null && mins < walkMins) return 'run';
      if (mins <= goMax) return 'go';
      return 'early';
    }

    function searchStatusStyle(st) {
      return { go:    { col:'#00e676', bg:'#0d2b1a', label:'✓ LEAVE NOW' },
               run:   { col:'#ff6a00', bg:'#2b1500', label:'<<< RUN >>>' },
               early: { col:'#ffab00', bg:'#2b2200', label:'◎ TOO EARLY' },
               late:  { col:'#ff1744', bg:'#2b0d0d', label:'✗ TOO LATE' } }[st];
    }

    async function doFetch() {
      const stopParam = encodeURIComponent(ids.join(','));
      const res = await fetch('/api/departures?stop=' + stopParam);
      const data = await res.json();
      const enriched = (data.departures || []).map(d => {
        const ts = d.departure_timestamp?.predicted || d.departure_timestamp?.scheduled;
        return { ...d, ts, mins: ts ? minsUntil(ts) : null };
      });

      // Build status card if timing is configured
      let statusHtml = '';
      if (walkMins) {
        const upcoming = enriched.filter(d => d.mins !== null && d.mins >= 0);
        const goGroup  = upcoming.filter(d => getSearchStatus(d.mins) === 'go');
        const runGroup = upcoming.filter(d => getSearchStatus(d.mins) === 'run');
        const hasAny   = goGroup.length > 0 || runGroup.length > 0;

        function cardLine(d) {
          const pInfo = selectedPlatforms[d.stop?.id];
          const dirLabel = pInfo?.dir ? \` · \${pInfo.dir}\` : '';
          const col = getSearchStatus(d.mins) === 'run' ? '#ff6a00' : '#00e676';
          return \`<div style="font-size:15px;color:#aaa;margin-top:6px"><strong style="color:#fff">\${d.route?.short_name}</strong>\${dirLabel} in <span data-ts="\${d.ts}" style="color:\${col};font-weight:700">\${fmtCountdown(d.mins)}</span> · departs \${fmt(d.ts)}</div>\`;
        }

        if (hasAny) {
          const sections = [];
          if (goGroup.length > 0) {
            sections.push(\`<div class="status-label" style="color:#00e676">✓ LEAVE NOW</div>\${goGroup.map(d => cardLine(d)).join('')}\`);
          }
          if (runGroup.length > 0) {
            sections.push(\`<div class="status-label" style="color:#ff6a00;margin-top:\${goGroup.length > 0 ? '14px' : '0'}"><<< RUN >>></div>\${runGroup.map(d => cardLine(d)).join('')}\`);
          }
          const borderCol = goGroup.length > 0 ? '#00e676' : '#ff6a00';
          const bgCol     = goGroup.length > 0 ? '#0d2b1a' : '#2b1500';
          statusHtml = \`<div class="status-card" style="background:\${bgCol};border-color:\${borderCol}">
            <div class="dot" style="background:\${borderCol};box-shadow:0 0 16px \${borderCol};flex-shrink:0;width:14px;height:14px;border-radius:50%;animation:pulse 2s infinite;margin-top:3px"></div>
            <div>\${sections.join('')}</div>
          </div>\`;
        } else {
          const next = upcoming[0];
          if (next) {
            const st = getSearchStatus(next.mins);
            const { col, bg, label: stLabel } = searchStatusStyle(st);
            const pInfo2 = selectedPlatforms[next.stop?.id];
            const dirLabel2 = pInfo2?.dir ? \` · \${pInfo2.dir}\` : '';
            statusHtml = \`<div class="status-card" style="background:\${bg};border-color:\${col}">
              <div class="dot" style="background:\${col};box-shadow:0 0 16px \${col};flex-shrink:0;width:14px;height:14px;border-radius:50%;animation:pulse 2s infinite;margin-top:3px"></div>
              <div>
                <div class="status-label" style="color:\${col}">\${stLabel}</div>
                <div style="font-size:15px;color:#aaa;margin-top:6px">
                  <strong style="color:#fff">\${next.route?.short_name}</strong>\${dirLabel2} in
                  <span data-ts="\${next.ts}" style="color:\${col};font-weight:700">\${fmtCountdown(next.mins)}</span>
                  · departs \${fmt(next.ts)}
                </div>
              </div>
            </div>\`;
          }
        }
      }

      const timingNote = walkMins
        ? \`<span style="color:#444">🚶\${walkMins}m\${runMins?' · 🏃'+runMins+'m':''}</span>\`
        : \`<span style="color:#333;cursor:pointer" onclick="editTiming('\${ids.join(',')}')">+ add walk time</span>\`;

      const rows = enriched.filter(d => d.mins !== null && d.mins >= -1).slice(0, 10).map(d => {
        const gone = d.mins < 0;
        const st = !gone && walkMins ? getSearchStatus(d.mins) : null;
        const minCol = gone ? '#555'
          : st === 'go'   ? '#00e676'
          : st === 'run'  ? '#ff6a00'
          : st === 'late' ? '#555'
          : '#e0e0e0';
        const rowClass = gone || st === 'late' ? 'gone'
          : st === 'go'  ? 'catchable-go'
          : st === 'run' ? 'catchable-run'
          : '';
        const pInfo = selectedPlatforms[d.stop?.id];
        const dirLabel = pInfo?.dir ? \`<span style="font-size:10px;color:#555;margin-left:4px">(\${pInfo.dir})</span>\` : '';
        return \`<div class="table-row \${rowClass}">
          <span class="line-num">\${d.route?.short_name||'—'}</span>
          <span class="headsign">\${d.trip?.headsign||'—'}\${dirLabel}</span>
          <span class="dep-time">\${d.ts?fmt(d.ts):'—'}</span>
          <span class="mins" style="color:\${minCol}" \${d.ts&&!gone?'data-ts="'+d.ts+'"':''}>\${d.mins!==null?(gone?'gone':fmtCountdown(d.mins)):'—'}</span>
          <span>\${!gone&&d.delay?.is_available&&d.delay.minutes>0?'<span class="late-badge">+'+d.delay.minutes+'m</span>':'<span class="on-time">on time</span>'}</span>
        </div>\`;
      }).join('');

      liveBoard.innerHTML = \`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:10px">
            <button onclick="closeLiveBoard()" style="background:none;border:none;color:#555;font-size:18px;cursor:pointer;padding:0;line-height:1" title="Back to search">←</button>
            <div style="font-family:'Jost',sans-serif;font-size:20px;font-weight:800;color:#fff">\${label}</div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;font-size:11px">
            \${timingNote}
            <button onclick="doFetch()" style="background:none;border:1px solid #2a2a3e;color:#666;padding:4px 10px;border-radius:6px;font-family:'Jost',sans-serif;font-size:12px;cursor:pointer" title="Refresh">↻</button>
            <button onclick="deleteSavedByIds('\${ids.join(',')}')" style="background:none;border:none;color:#444;font-size:16px;cursor:pointer;padding:0;line-height:1" title="Delete saved stop">🗑</button>
          </div>
        </div>
        \${statusHtml}
        <div class="table">
          <div class="table-head"><span>Line</span><span>Direction</span><span>Departs</span><span>In</span><span>Status</span></div>
          \${rows || '<div style="padding:24px;text-align:center;color:#444">No departures found.</div>'}
        </div>\`;
    }

    await doFetch();
    searchInterval = setInterval(doFetch, 30000);
  }

  function closeLiveBoard() {
    if (searchInterval) { clearInterval(searchInterval); searchInterval = null; }
    document.getElementById('live-board').innerHTML = '';
    selectedPlatforms = {};
    expandSearch();
    document.getElementById('search-input').value = '';
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('search-results').innerHTML = '';
    const btn = document.getElementById('build-btn');
    btn.disabled = true;
    btn.style.display = 'none';
    btn.textContent = 'Show departures for selected platforms';
    renderSaved();
  }

  function deleteSavedByIds(idsStr) {
    if (!confirm('Remove this saved stop?')) return;
    const saved = getSaved().filter(s => s.ids.join(',') !== idsStr);
    setSaved(saved);
    closeLiveBoard();
  }

  function editTiming(idsStr) {
    const ids = idsStr.split(',');
    const saved = getSaved();
    const idx = saved.findIndex(s => s.ids.join(',') === ids.join(','));
    if (idx < 0) return;
    const s = saved[idx];
    const walk = prompt('Walking time (minutes):', s.walkMins || '');
    if (walk === null) return;
    const run = prompt('Running time (minutes):', s.runMins || '');
    if (run === null) return;
    saved[idx].walkMins = parseFloat(walk) || null;
    saved[idx].runMins  = parseFloat(run)  || null;
    setSaved(saved);
    renderSaved();
    fetchAndRenderLive(ids, s.label, saved[idx].walkMins, saved[idx].runMins);
  }

  function expandSearch() {
    const wrap = document.getElementById('search-wrap');
    wrap.classList.remove('collapsed');
    document.getElementById('search-input').focus();
  }

  function collapseSearch() {
    const wrap = document.getElementById('search-wrap');
    wrap.classList.add('collapsed');
    document.getElementById('search-results').style.display = 'none';
  }

  function toggleSaved() {
    const list = document.getElementById('saved-list');
    const btn  = document.getElementById('saved-toggle');
    const hidden = list.style.display === 'none';
    list.style.display = hidden ? '' : 'none';
    btn.textContent = hidden ? 'Hide' : 'Show';
  }

  function onSearch(val) { renderResults(val); }

  // Strip diacritics for fuzzy matching
  function norm(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }

  function renderResults(val) {
    const q = norm(val.trim());
    const resultsEl = document.getElementById('search-results');
    if (q.length < 2) { resultsEl.style.display = 'none'; return; }

    const matches = stopsDb.filter(s => norm(s[0]).includes(q)).slice(0, 20);
    if (matches.length === 0) { resultsEl.style.display = 'none'; return; }

    resultsEl.style.display = 'block';
    resultsEl.innerHTML = matches.map(([name, , , platforms]) => {
      const platformsHtml = platforms.map(([id, plat, dir]) => {
        const checked = !!selectedPlatforms[id];
        return \`<div class="platform-row">
          <span class="platform-id">\${id}</span>
          <span class="platform-dir">Platform \${plat}\${dir ? ' · ' + dir : ''}</span>
          <div class="platform-check \${checked ? 'checked' : ''}" onclick="togglePlatform('\${id}','\${name}','\${plat}','\${dir||''}',this)">\${checked ? '✓' : ''}</div>
        </div>\`;
      }).join('');
      return \`<div class="search-station">
        <div class="search-station-name" onclick="this.parentElement.classList.toggle('open')">
          \${name} <span style="font-size:10px;color:#444">\${platforms.length} platform\${platforms.length>1?'s':''} ▾</span>
        </div>
        <div class="search-platforms">\${platformsHtml}</div>
      </div>\`;
    }).join('');
  }

  function togglePlatform(id, stationName, platform, dir, el) {
    if (selectedPlatforms[id]) {
      delete selectedPlatforms[id];
      el.classList.remove('checked');
      el.textContent = '';
    } else {
      selectedPlatforms[id] = { stationName, platform, dir };
      el.classList.add('checked');
      el.textContent = '✓';
    }
    const count = Object.keys(selectedPlatforms).length;
    const btn = document.getElementById('build-btn');
    btn.disabled = count === 0;
    btn.style.display = count === 0 ? 'none' : 'block';
    btn.textContent = count > 0
      ? \`Show departures for \${count} platform\${count>1?'s':''}\`
      : 'Show departures for selected platforms';
  }


</script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/stops") {
    res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
    res.end(STOPS_DATA);
  } else if (url.pathname === "/api/departures") {
    const stopParam = decodeURIComponent(url.searchParams.get("stop") || STOPS[0].id);
    const idsQuery = stopParam.split(',').map(id => `ids=${id.trim()}`).join('&');
    try {
      const apiRes = await fetch(
        `https://api.golemio.cz/v2/pid/departureboards?${idsQuery}&minutesAfter=60`,
        { headers: { "x-access-token": TOKEN } }
      );
      const data = await apiRes.json();
      const count = data.departures?.length ?? 0;
      console.log(`[api] ${new Date().toLocaleTimeString('cs-CZ')} GET departures stops=${stopParam} → ${apiRes.status} (${count} departures)`);
      const departures = (data.departures || []).sort((a, b) => {
        const tsA = a.departure_timestamp?.predicted || a.departure_timestamp?.scheduled;
        const tsB = b.departure_timestamp?.predicted || b.departure_timestamp?.scheduled;
        return new Date(tsA) - new Date(tsB);
      });
      res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
      res.end(JSON.stringify({ departures }));
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
  } else {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(HTML);
  }
});

server.listen(PORT, () => {
  console.log(`✅ Running at http://localhost:${PORT}`);
  console.log(`   Press Ctrl+C to stop.`);
});
