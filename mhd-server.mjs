// Run with: node bus-server.mjs
// Then open: http://localhost:3000

import http from "http";

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDkxNywiaWF0IjoxNzcyODAzNjQxLCJleHAiOjExNzcyODAzNjQxLCJpc3MiOiJnb2xlbWlvIiwianRpIjoiNmEyZWUyMGEtOTBkMy00NDk3LWIzNTEtODgzOGVlMGNjMWZiIn0.eGqe63Kxh05TRDb4umJMtx6WMZBqUcq8V90tMzVpVpg";
const PORT = process.env.PORT || 3000;

const STOPS = [
  { id: "U930Z2P", label: "Kobrova -> Centrum" },
  { id: "U481Z3P", label: "Švandovo divadlo -> Nahoře" },
  { ids: ["U481Z1P", "U481Z2P", "U481Z3P", "U481Z4P"], label: "Švandovo divadlo" },
];

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Holečkova MHD odjezdy</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Space Mono', monospace; background: #0a0a0f; color: #e0e0e0; min-height: 100vh; padding: 28px 24px; }
  .wrap { max-width: 680px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .clock { font-size: 13px; color: #888; font-variant-numeric: tabular-nums; }
  h1 { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; letter-spacing: -1px; color: #fff; margin-bottom: 20px; }
  .tabs { display: flex; gap: 8px; margin-bottom: 24px; }
  .tab { font-family: 'Space Mono', monospace; font-size: 12px; padding: 8px 18px; border-radius: 8px; border: 1.5px solid #1e1e2e; background: transparent; color: #555; cursor: pointer; transition: all .2s; letter-spacing: 1px; text-transform: uppercase; }
  .tab:hover { border-color: #333; color: #aaa; }
  .tab.active { border-color: #444; background: #16161f; color: #e0e0e0; }
  .stop-id { font-size: 10px; letter-spacing: 3px; color: #444; text-transform: uppercase; margin-bottom: 20px; }
  .status-card { display: flex; align-items: center; gap: 16px; border: 1.5px solid; border-radius: 12px; padding: 18px 22px; margin-bottom: 24px; transition: background .4s, border-color .4s; }
  .dot { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; animation: pulse 2s infinite; }
  .status-label { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; letter-spacing: 1px; margin-bottom: 4px; }
  .status-sub { font-size: 12px; color: #aaa; line-height: 1.6; }
  .delay-badge { display: inline-block; margin-top: 6px; font-size: 10px; background: #ff6b35; color: #fff; padding: 2px 8px; border-radius: 4px; letter-spacing: 1px; }
  .table { border: 1px solid #1e1e2e; border-radius: 10px; overflow: hidden; }
  .table-head, .table-row { display: grid; grid-template-columns: 52px 1fr 72px 60px 72px; gap: 8px; padding: 10px 16px; align-items: center; }
  .table-head { font-size: 10px; letter-spacing: 2px; color: #444; text-transform: uppercase; background: #111118; border-bottom: 1px solid #1e1e2e; }
  .table-row { font-size: 12px; border-bottom: 1px solid #13131f; }
  .table-row.gone { opacity: 0.4; }
  .table-row.catchable { background: rgba(0,230,118,.06); }
  .line-num { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 15px; color: #fff; }
  .headsign { color: #bbb; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dep-time { color: #888; font-variant-numeric: tabular-nums; }
  .mins { font-variant-numeric: tabular-nums; font-weight: 700; }
  .on-time { font-size: 10px; color: #444; }
  .late-badge { font-size: 10px; color: #ff6b35; }
  .error-box { background: #2b0d0d; border: 1px solid #ff1744; color: #ff6659; padding: 14px 18px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; }
  .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; font-size: 11px; color: #444; }
  .refresh-btn { background: none; border: 1px solid #2a2a3e; color: #666; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-family: 'Space Mono', monospace; font-size: 11px; }
  .refresh-btn:hover { border-color: #444; color: #aaa; }
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
    font-size: 12px;
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

  // Build tabs
  function buildTabs() {
    document.getElementById('tabs').innerHTML = STOPS.map((s, i) => {
      const subtitle = s.ids ? 'Všechno' : s.id;
      return \`<button class="tab \${i===activeTab?'active':''}" onclick="switchTab(\${i})">\${s.label}<br><span style="font-size:9px;opacity:.5">\${subtitle}</span></button>\`;
    }).join('');
  }

  function switchTab(i) {
    activeTab = i;
    buildTabs();
    if (cache[i]) {
      fullRender(cache[i]);
    } else {
      load();
    }
  }

  // TICK: every second — patch text in place, no DOM rebuild
  function tick() {
    document.getElementById('clock').textContent = new Date().toLocaleTimeString('cs-CZ');
    const deps = cache[activeTab];
    if (!deps) return;

    document.querySelectorAll('[data-ts]').forEach(el => {
      const mins = minsUntil(el.dataset.ts);
      el.textContent = mins < 0 ? 'gone' : fmtCountdown(mins);
    });

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
        div.style.cssText = 'margin-top:8px;font-size:11px;color:#888';
        div.innerHTML = \`Next: <strong style="color:#ccc">\${after.route?.short_name}</strong> at <strong style="color:#ccc">\${fmt(after.ts)}</strong> · in <span data-ts="\${after.ts}" style="color:#aaa">\${fmtCountdown(after.mins)}</span>\`;
        card.querySelector('.status-sub').parentNode.appendChild(div);
      }
    }
  }
  setInterval(tick, 1000); tick();

  // FETCH: load active tab's stop from API
  async function load() {
    const stop = STOPS[activeTab];
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
        return \`<div style="margin-top:6px;font-size:12px;color:#aaa">
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
                <div style="margin-top:6px;font-size:12px;color:#888">
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
          ? \`<div class="after-line" style="margin-top:8px;font-size:11px;color:#888">Next: <strong style="color:#ccc">\${after.route?.short_name}</strong> at <strong style="color:#ccc">\${fmt(after.ts)}</strong> · in <span data-ts="\${after.ts}" style="color:#aaa">\${fmtCountdown(after.mins)}</span></div>\`
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
      const inWin = !gone && d.mins >= WINDOW_RUN_MIN && d.mins <= WINDOW_MAX;
      const minCol = gone ? '#888' : inWin ? '#00e676' : '#e0e0e0';
      const statusCell = gone ? '' : (d.delay?.is_available && d.delay.minutes > 0)
        ? \`<span class="late-badge">+\${d.delay.minutes}m</span>\`
        : \`<span class="on-time">on time</span>\`;
      const stopId = d.stop?.id;
      const headsign = (STOPS[activeTab].ids && stopId && STOP_LABELS[stopId])
        ? STOP_LABELS[stopId]
        : (d.trip?.headsign || '—');
      return \`<div class="table-row \${gone?'gone':''} \${inWin?'catchable':''}">
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
</script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/departures") {
    const stopParam = decodeURIComponent(url.searchParams.get("stop") || STOPS[0].id);
    const idsQuery = stopParam.split(',').map(id => `ids=${id.trim()}`).join('&');
    try {
      const apiRes = await fetch(
        `https://api.golemio.cz/v2/pid/departureboards?${idsQuery}&minutesAfter=60`,
        { headers: { "x-access-token": TOKEN } }
      );
      const data = await apiRes.json();
      // Merge departures from all stops and sort by departure time
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
