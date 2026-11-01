// CSS visual regression rig — capture. See tools/css_rig/README.md.
// Usage: node tools/css_rig/capture.js <tag> [--quick] [--jobs=3] [--vps=1366x1024,1180x820@2] [--only=main,past,modal,admin,state,pseudo] [--themes=pokemon,unicorn]
// --quick: 1366x1024 + 390x844, main/past/state only (~2 min) for iterating; compare.js skips the
//          screens a quick run didn't take. Run a full capture before committing.
// --jobs=N: viewports are split across N Chrome instances running in parallel (default 3).
// Needs the usual static server on :8000 (python3 -m http.server 8000). tests.js is blanked
// via CDP so the app boots in test mode without running the suite. Output goes OUTSIDE the
// repo (default ~/.cache/kpc-css-rig/<tag>, override with CSS_RIG_OUT).
// Determinism: fixed clock (Wed 2026-10-28 10:00 local), seeded Math.random, remote sprites
// stubbed with a fixed PNG, animations/transitions collapsed to their end state, canvases hidden.
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const REPO = path.resolve(__dirname, '..', '..');
const tag = process.argv[2];
if (!tag || tag.startsWith('--')) { console.error('usage: node capture.js <tag> [--vps=..] [--only=..] [--themes=..]'); process.exit(2); }
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const QUICK = process.argv.includes('--quick');
const CHILD = process.argv.includes('--child');
const JOBS = +arg('jobs', 3);
const VPS = arg('vps', QUICK ? '1366x1024,390x844' : '1366x1024,1180x820,1180x820@2,768x1024,390x844').split(',').map(s => { const m = s.match(/^(\d+)x(\d+)(?:@(\d+))?$/); return { w: +m[1], h: +m[2], dpr: +(m[3] || 1), name: s }; });
const ONLY = arg('only', QUICK ? 'main,past,state' : 'main,past,modal,admin,state,pseudo').split(',');
const THEMES = arg('themes', 'pokemon,unicorn').split(',');
const OUT_ROOT = process.env.CSS_RIG_OUT || path.join(os.homedir(), '.cache', 'kpc-css-rig');
const OUT = path.join(OUT_ROOT, tag);
const PORT = +(process.env.CSS_RIG_CDP_PORT || 9271);
const BASE = process.env.CSS_RIG_BASE || 'http://127.0.0.1:8000';
const URL = `${BASE}/index.html?runTests=true&headless=true`;
const FIXED = new Date('2026-10-28T10:00:00').getTime();

function solidPng(w, h, rgb) {
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = rgb[0]; raw[o + 1] = rgb[1]; raw[o + 2] = rgb[2]; }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const SPRITE = solidPng(96, 96, [160, 196, 255]).toString('base64');

const PRELUDE = `(() => {
  const RealDate = Date, OFF = ${FIXED} - RealDate.now();
  class FDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(RealDate.now() + OFF); } static now() { return RealDate.now() + OFF; } }
  window.Date = FDate;
  let seed = 1234567; Math.random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const css = '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;animation-iteration-count:1!important;transition-duration:0s!important;transition-delay:0s!important;caret-color:transparent!important}canvas{visibility:hidden!important}';
  const add = () => { const s = document.createElement('style'); s.id = '__rig_css'; s.textContent = css; (document.head || document.documentElement).appendChild(s); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add();
})();`;

// cursor / pointer-events / touch-action are included on purpose: many !important rules
// control what a child can tap, which a screenshot cannot show.
const PROPS = ['display', 'position', 'top', 'left', 'width', 'height', 'margin', 'padding', 'color', 'background-color', 'background-image', 'border', 'border-radius', 'box-shadow', 'font-family', 'font-size', 'font-weight', 'line-height', 'opacity', 'transform', 'z-index', 'gap', 'grid-template-columns', 'flex', 'justify-content', 'align-items', 'text-align', 'filter', 'backdrop-filter', 'outline', 'visibility', 'cursor', 'pointer-events', 'touch-action', 'overflow', 'content', 'animation-name'];
const fingerprint = (root) => `(() => {
  const P = ${JSON.stringify(PROPS)}; const out = {};
  const path = e => { const a = []; while (e && e !== document.body) { let s = e.tagName.toLowerCase(); if (e.id) { a.unshift(s + '#' + e.id); break; } const p = e.parentElement; if (p) s += ':' + [...p.children].indexOf(e); a.unshift(s); e = p; } return a.join('>'); };
  const root = ${root ? `document.querySelector(${JSON.stringify(root)})` : 'document.body'};
  for (const e of [root, ...root.querySelectorAll('*')]) {
    if (e.id === '__rig_css' || e.closest('script,style')) continue;
    const r = e.getBoundingClientRect(); if (!r.width && !r.height) continue;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden') continue;
    const o = { box: [r.left, r.top, r.width, r.height].map(v => Math.round(v * 10) / 10).join(',') };
    for (const p of P) o[p] = cs.getPropertyValue(p);
    for (const pe of ['::before', '::after']) { const c = getComputedStyle(e, pe); if (c.content && c.content !== 'none' && c.content !== 'normal') o[pe] = [c.content, c.width, c.height, c.backgroundColor, c.backgroundImage.slice(0, 120), c.boxShadow, c.transform, c.opacity].join('|'); }
    out[path(e)] = o;
  }
  return out;
})()`;

const getTargets = () => new Promise((res, rej) => { http.get(`http://127.0.0.1:${PORT}/json`, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on('error', rej); });
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  if (!CHILD) {
    fs.rmSync(OUT, { recursive: true, force: true });
    fs.mkdirSync(OUT, { recursive: true });
    for (const f of fs.readdirSync(REPO).filter(f => f.endsWith('.css'))) fs.copyFileSync(path.join(REPO, f), path.join(OUT, f));
    if (QUICK || process.argv.some(a => a.startsWith('--only=') || a.startsWith('--vps=') || a.startsWith('--themes='))) fs.writeFileSync(path.join(OUT, 'PARTIAL'), process.argv.slice(3).join(' '));
    const jobs = Math.min(JOBS, VPS.length);
    if (jobs > 1) {
      // Split viewports round-robin (heaviest first) across child processes, one Chrome each.
      const order = [...VPS].sort((a, b) => b.w * b.h * b.dpr * b.dpr - a.w * a.h * a.dpr * a.dpr);
      const groups = Array.from({ length: jobs }, () => []); order.forEach((v, k) => groups[k % jobs].push(v.name));
      const pass = process.argv.slice(3).filter(a => !/^--(vps|jobs)=/.test(a) && a !== '--quick');
      if (QUICK) pass.push(`--only=${ONLY.join(',')}`);
      const t0 = Date.now();
      const codes = await Promise.all(groups.map((g, k) => new Promise(res => {
        const c = spawn(process.execPath, [__filename, tag, `--vps=${g.join(',')}`, '--child', ...pass], { env: { ...process.env, CSS_RIG_CDP_PORT: String(PORT + k) }, stdio: ['ignore', 'pipe', 'inherit'] });
        c.stdout.on('data', d => String(d).split('\n').filter(l => /^done /.test(l)).forEach(l => console.log(l)));
        c.on('exit', res);
      })));
      const logs = fs.readdirSync(OUT).filter(f => /^log-\d+\.txt$/.test(f)).map(f => { const t = fs.readFileSync(path.join(OUT, f), 'utf8'); fs.unlinkSync(path.join(OUT, f)); return t; }).filter(Boolean);
      fs.writeFileSync(path.join(OUT, 'log.txt'), logs.join('\n'));
      console.log(`out: ${OUT} (${jobs} jobs, ${Math.round((Date.now() - t0) / 1000)} s)`);
      console.log(logs.length ? 'WARN\n' + logs.join('\n') : 'no errors');
      process.exit(codes.some(c => c) ? 1 : 0);
    }
  }
  const prof = path.join(os.tmpdir(), `kpc-css-rig-${PORT}`);
  fs.rmSync(prof, { recursive: true, force: true });
  const chrome = spawn('google-chrome', ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage', '--no-first-run', '--hide-scrollbars', '--font-render-hinting=none', '--force-color-profile=srgb', 'about:blank']);
  let targets; for (let i = 0; i < 100; i++) { try { targets = await getTargets(); if (targets.length) break; } catch (e) { } await sleep(100); }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 1; const pending = new Map();
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Fetch.requestPaused') {
      const isTests = /\/tests\.js/.test(m.params.request.url);
      ws.send(JSON.stringify({ id: id++, method: 'Fetch.fulfillRequest', params: { requestId: m.params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: isTests ? 'text/javascript' : 'image/png' }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: isTests ? '' : SPRITE } }));
    }
  });
  const send = (method, params = {}) => new Promise(r => { const i = id++; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result && r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result && r.result.result && r.result.result.value; };
  await send('Page.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*raw.githubusercontent.com*' }, { urlPattern: '*pokeapi.co*' }, { urlPattern: '*/tests.js*' }] });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: PRELUDE });

  const log = [];
  let vpCur;
  async function boot(vp, theme) {
    vpCur = vp;
    await send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: vp.dpr, mobile: vp.w < 768 });
    await send('Page.navigate', { url: URL });
    await sleep(500);
    for (let i = 0; i < 100; i++) { await sleep(150); try { if (await ev('!!window.__test_helpers__ && !!window.__app_state__')) break; } catch (e) { } }
    await sleep(500);
    // Seed week: earlier days done except one miss; today 1 done; a checked bonus (Great Ball /
    // Crown) on day 0, an unchecked bonus today, a rest day tomorrow, and the last activity
    // removed from the day after tomorrow (State 7 "Not on the plan"). Last week archived.
    await ev(`(async () => {
      const s = window.__app_state__, h = window.__test_helpers__;
      s.theme = '${theme}'; s.childName = '${theme === 'unicorn' ? 'Lyra' : 'Kepler'}';
      s.reward = s.weeklyRewardOptions[0].value; s.megaReward = s.megaRewardOptions[0].value;
      const fmt = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const day = n => { const d = new Date(s.weekStartDate + 'T00:00:00'); d.setDate(d.getDate() + n); return fmt(d); };
      const todayIdx = Math.round((new Date(fmt(new Date()) + 'T00:00:00') - new Date(s.weekStartDate + 'T00:00:00')) / 864e5);
      const tasks = s.tasks.filter(t => !t.deletedAt);
      for (let d = 0; d < todayIdx; d++) tasks.forEach((t, i) => { if (!(d === 1 && i === 2)) s.grid[day(d) + '-' + t.id] = true; });
      if (tasks[0]) s.grid[day(todayIdx) + '-' + tasks[0].id] = true;
      if (tasks[3]) s.excused[day(todayIdx) + '-' + tasks[3].id] = 'bonus';
      if (tasks[2]) s.excused[day(0) + '-' + tasks[2].id] = 'bonus';
      if (tasks[4]) s.excused[day(Math.min(6, todayIdx + 1)) + '-' + tasks[4].id] = 'rest';
      if (tasks[1] && todayIdx <= 4) tasks[1].deletedAt = day(todayIdx + 2);
      const ls = new Date(s.weekStartDate + 'T00:00:00'); ls.setDate(ls.getDate() - 7);
      s.weeklyHistory = { [fmt(ls)]: { weekStartDay: s.weekStartDay, weeklyClaimed: false, badgeId: 7, xpEarned: 0, megaWeeks: 0 } };
      for (let d = 0; d < 7; d++) { const dd = new Date(ls); dd.setDate(dd.getDate() + d); const ds = fmt(dd);
        tasks.forEach((t, i) => { if ((d + i) % 3 !== 0) s.grid[ds + '-' + t.id] = true; });
        if (d === 2 && tasks[3]) s.excused[ds + '-' + tasks[3].id] = 'rest';
        if (d === 4 && tasks[2]) s.excused[ds + '-' + tasks[2].id] = 'bonus'; }
      h.renderState(true);
      document.querySelectorAll('.trainer-name-label').forEach(e => e.textContent = s.childName);
    })()`);
    await sleep(400);
  }
  const clean = `(() => { document.querySelectorAll('body *').forEach(e => { if (getComputedStyle(e).position === 'fixed' && /emulator mode/i.test(e.textContent || '') && e.querySelectorAll('*').length < 5) e.remove(); }); document.activeElement && document.activeElement.blur && document.activeElement.blur(); })()`;
  async function shot(dir, name, full, clip, root) {
    if (!clip) await ev(clean);
    await ev('document.fonts.ready.then(() => 1)'); await sleep(250);
    if (full) { const m = await ev('({w: document.documentElement.clientWidth, h: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)})'); clip = { x: 0, y: 0, width: m.w, height: m.h, scale: 1 }; }
    const s = await send('Page.captureScreenshot', Object.assign({ format: 'png' }, clip ? { captureBeyondViewport: true, clip } : {}));
    if (!s.result) throw new Error('screenshot failed: ' + JSON.stringify(s.error || s).slice(0, 200));
    fs.writeFileSync(path.join(dir, name + '.png'), Buffer.from(s.result.data, 'base64'));
    fs.writeFileSync(path.join(dir, name + '.css.json'), JSON.stringify(await ev(fingerprint(root))));
  }
  const SCROLL_END = `(() => { const m = [...document.querySelectorAll('.modal:not(.hidden), #debug-sidebar.open')].pop(); if (!m) return false;
    const sc = [m, ...m.querySelectorAll('*')].filter(e => { const cs = getComputedStyle(e); return /auto|scroll/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 4 && e.clientHeight > 80; });
    if (!sc.length) return false; sc.forEach(e => e.scrollTop = e.scrollHeight); return true; })()`;
  async function shotWithEnd(dir, name) { await shot(dir, name, false); if (await ev(SCROLL_END)) { await sleep(200); await shot(dir, name + '--end', false); } }
  const setStyle = st => ev(`(() => { window.__app_state__.chartStyle = '${st}'; window.__test_helpers__.renderState(true); })()`);
  const closeAll = `(() => { document.querySelectorAll('.notif-modal').forEach(e => e.remove()); document.querySelectorAll('.modal:not(.hidden)').forEach(m => m.classList.add('hidden')); document.body.classList.remove('modal-open'); })()`;
  const openAdmin = `(async () => {
    document.getElementById('admin-btn').click(); await new Promise(r => setTimeout(r, 300));
    const pc = (window.__test_helpers__.getParentPasscode && window.__test_helpers__.getParentPasscode()) || 'zxcv';
    const inp = document.getElementById('password-input'); if (inp) { inp.value = pc; inp.dispatchEvent(new Event('input', { bubbles: true })); }
    document.getElementById('password-submit-btn').click(); await new Promise(r => setTimeout(r, 400));
    return !document.getElementById('admin-modal').classList.contains('hidden');
  })()`;

  const MODALS = [
    ['partner', `document.getElementById('change-partner-btn').click()`],
    ['showcase', `window.__test_helpers__.openPartnerShowcaseModal()`],
    ['notification', `document.getElementById('notification-modal').classList.remove('hidden')`],
    ['levelup', `window.__test_helpers__.addXp(100)`],
    ['vault', `(document.getElementById('open-vault-btn') || document.getElementById('open-vault-simplified-btn')).click()`],
    ['shop', `window.__test_helpers__.openPokemonShop()`],
    ['badges', `document.getElementById('open-badges-btn').click()`],
    ['guide', `window.__test_helpers__.openGuide()`],
    ['eevee', `document.getElementById('eevee-modal').classList.remove('hidden')`],
    ['confirm', `document.getElementById('confirm-modal').classList.remove('hidden')`],
    ['password', `document.getElementById('admin-btn').click()`],
    ['profiles', `window.__test_helpers__.setProfilesList([{ id: 'p1', name: 'Kepler', avatarId: '25' }, { id: 'p2', name: 'Lyra', avatarId: '700' }]); document.getElementById('switch-profile-btn').click()`],
    ['addprofile', `document.getElementById('add-profile-modal').classList.remove('hidden')`],
    ['familylogin', `document.getElementById('family-login-modal').classList.remove('hidden')`],
    ['debug', `document.getElementById('debug-sidebar') && document.getElementById('debug-sidebar').classList.add('open')`],
  ];
  const ADMIN_TABS = ['today', 'tasks', 'rewards', 'children', 'data'];
  // :hover / :active / :focus-visible on tappable things (forced via CDP).
  const PSEUDO_TARGETS = {
    standard: ['#change-partner-btn', '#open-badges-btn', '#prev-week-btn', '.day-header[data-column-state="selectable_past"]', '#grid-tbody tr:first-child td.checkbox-cell[data-column-state="active_today"] .pokeball-checkbox', '.checkbox-cell.bonus-cell .pokeball-checkbox', '.grid-vault-tile', '#switch-profile-btn', '#admin-btn', '#open-guide-btn'],
    'big-buttons': ['.simplified-task-card', '.simplified-day-pill:not(.is-focused)', '.simplified-vault-tile', '.simplified-catch-ball'],
  };

  for (const vp of VPS) {
    const dir = path.join(OUT, vp.name); fs.mkdirSync(dir, { recursive: true });
    for (const theme of THEMES) {
      const step = async (label, fn) => { try { await fn(); } catch (e) { log.push(`${vp.name} ${theme} ${label}: ${e.message.slice(0, 200)}`); } };
      await boot(vp, theme);
      if (ONLY.includes('main')) for (const st of ['standard', 'big-buttons']) await step(`main ${st}`, async () => { await setStyle(st); await sleep(300); await shot(dir, `main__${theme}__${st}`, true); });
      if (ONLY.includes('past')) for (const st of ['standard', 'big-buttons']) await step(`past ${st}`, async () => {
        await setStyle(st); await ev(`document.getElementById('prev-week-btn').click()`); await sleep(400);
        await shot(dir, `past__${theme}__${st}`, true);
        await ev(`(document.getElementById('back-to-today-btn').offsetParent ? document.getElementById('back-to-today-btn') : document.getElementById('next-week-btn')).click()`); await sleep(300);
      });
      if (ONLY.includes('pseudo')) for (const st of ['standard', 'big-buttons']) await step(`pseudo ${st}`, async () => {
        await setStyle(st); await sleep(300); await ev(clean);
        await send('DOM.enable'); await send('CSS.enable');
        for (const sel of PSEUDO_TARGETS[st]) {
          const doc = await send('DOM.getDocument', { depth: 0 });
          const q = await send('DOM.querySelector', { nodeId: doc.result.root.nodeId, selector: sel });
          if (!q.result || !q.result.nodeId) { log.push(`${vp.name} ${theme} pseudo: no match for ${sel}`); continue; }
          await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({ block: 'center' }); e.setAttribute('data-rig-pseudo', '1'); })()`);
          for (const pc of ['hover', 'active', 'focus-visible']) {
            await send('CSS.forcePseudoState', { nodeId: q.result.nodeId, forcedPseudoClasses: [pc] }); await sleep(120);
            const r = await ev(`(() => { const b = document.querySelector('[data-rig-pseudo]').getBoundingClientRect(); return { x: Math.max(0, b.left + scrollX - 14), y: Math.max(0, b.top + scrollY - 14), width: b.width + 28, height: b.height + 28, scale: 1 }; })()`);
            const safe = sel.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').slice(0, 60);
            await shot(dir, `pseudo__${theme}__${st}__${safe}__${pc}`, false, r, '[data-rig-pseudo]');
          }
          await send('CSS.forcePseudoState', { nodeId: q.result.nodeId, forcedPseudoClasses: [] });
          await ev(`document.querySelector('[data-rig-pseudo]').removeAttribute('data-rig-pseudo')`);
        }
        await ev('window.scrollTo(0, 0)');
      });
      if (ONLY.includes('modal')) {
        await setStyle('standard');
        for (const [name, js] of MODALS) {
          await step(`modal ${name}`, async () => { await ev(closeAll); await ev(js); await sleep(500); await shotWithEnd(dir, `modal-${name}__${theme}`); });
          await ev(closeAll); await ev(`document.getElementById('debug-sidebar') && document.getElementById('debug-sidebar').classList.remove('open')`);
        }
      }
      if (ONLY.includes('admin') && theme === THEMES[0]) await step('admin', async () => {
        await ev(closeAll); if (!await ev(openAdmin)) throw new Error('admin did not open');
        for (const t of ADMIN_TABS) { await ev(`document.getElementById('admin-tab-${t}').click()`); await sleep(350); await shotWithEnd(dir, `admin-${t}`); }
        await ev(`document.getElementById('close-admin-modal-btn').click()`); await sleep(400);
      });
      if (ONLY.includes('state')) {
        // Parent Exception Mode (both chart styles: Big Buttons switches to the full grid).
        for (const st of ['standard', 'big-buttons']) await step(`exception ${st}`, async () => {
          await boot(vp, theme); await setStyle(st);
          if (!await ev(openAdmin)) throw new Error('admin did not open');
          await ev(`document.getElementById('admin-tab-today').click()`); await sleep(200);
          await ev(`document.getElementById('exceptions-btn').click()`); await sleep(900);
          if (!await ev(`!!document.querySelector('.exception-mode')`)) throw new Error('exception mode did not start');
          await shot(dir, `state-exception__${theme}__${st}`, true);
        });
        // Fix last week: past week editable + the parent grace dock.
        await step('fixlastweek', async () => {
          await boot(vp, theme); await setStyle('standard');
          if (!await ev(openAdmin)) throw new Error('admin did not open');
          await ev(`document.getElementById('admin-tab-today').click()`); await sleep(200);
          await ev(`document.getElementById('admin-fix-last-week-btn').click()`);
          // Wait for the grace dock, then pin its countdown text so the screen is deterministic.
          for (let i = 0; i < 40 && !await ev(`(() => { const d = document.getElementById('parent-grace-dock'); return !!d && !d.classList.contains('hidden'); })()`); i++) await sleep(100);
          await sleep(500);
          await ev(`(() => { const t = document.getElementById('parent-grace-timer'); if (t) { t.textContent = '2:00'; new MutationObserver(() => { if (t.textContent !== '2:00') t.textContent = '2:00'; }).observe(t, { childList: true, characterData: true, subtree: true }); } })()`);
          await sleep(300);
          await shot(dir, `state-fixlastweek__${theme}`, true);
        });
        // Superseded / forward-hashed columns (week start moved mid-week; same set-up as TC60).
        for (const st of ['standard', 'big-buttons']) await step(`superseded ${st}`, async () => {
          await boot(vp, theme); await setStyle(st);
          await ev(`(async () => {
            const s = window.__app_state__, h = window.__test_helpers__;
            s.weekStartDate = '2026-10-23'; s.weekStartDay = 5;
            s.weeklyHistory = { '2026-10-19': { weekStartDay: 1, weeklyClaimed: false, badgeId: 25 } };
            const tasks = s.tasks.filter(t => !t.deletedAt);
            s.grid['2026-10-19-' + tasks[0].id] = true; s.grid['2026-10-20-' + tasks[1].id] = true;
            s.excused['2026-10-24-' + tasks[0].id] = 'bonus'; s.excused['2026-10-21-' + tasks[2].id] = 'rest';
            h.setViewingWeekStartDate('2026-10-19'); h.renderState(true);
          })()`); await sleep(500);
          await shot(dir, `state-superseded__${theme}__${st}`, true);
        });
        // Boot skeleton.
        await step('booting', async () => { await boot(vp, theme); await ev(`document.body.classList.add('app-booting')`); await sleep(200); await shot(dir, `state-booting__${theme}`, false); });
      }
      console.log('done', vp.name, theme);
    }
  }
  fs.writeFileSync(path.join(OUT, CHILD ? `log-${PORT}.txt` : 'log.txt'), log.join('\n'));
  console.log(`out: ${OUT}`);
  console.log(log.length ? 'WARN\n' + log.join('\n') : 'no errors');
  ws.close(); chrome.kill(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
