// CSS visual regression rig — compare. See tools/css_rig/README.md.
// node tools/css_rig/compare.js <tagA> <tagB>
// 1. Safari-safety lint on the CSS copies saved with each capture (see lint()).
// 2. Pixel + computed-style diff of every screen captured in both runs.
// Exit 0 = no lint errors and no changes beyond raster noise. Changed pixels are written in
// magenta to <out>/diff_<A>_<B>/<vp>/<screen>.png.
const fs = require('fs'), os = require('os'), path = require('path'), zlib = require('zlib');
const [A, B] = process.argv.slice(2);
if (!A || !B) { console.error('usage: node compare.js <tagA> <tagB>'); process.exit(2); }
const root = process.env.CSS_RIG_OUT || path.join(os.homedir(), '.cache', 'kpc-css-rig');

// ---- lint: things a Chrome-only screenshot rig cannot see ----
// a) every vendor-prefixed declaration in A must still exist in B (e.g. -webkit-backdrop-filter
//    keeps the blur on iPad Safari); b) @keyframes must be unchanged (the rig freezes animations);
// c) no new selector list may mix a vendor pseudo (::-webkit-*, ::-moz-*, :-moz-*, ::-ms-*) with
//    other selectors: a browser that doesn't know the pseudo drops the whole rule.
function cssOf(tag) { const d = path.join(root, tag); return fs.readdirSync(d).filter(f => f.endsWith('.css')).map(f => fs.readFileSync(path.join(d, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')).join('\n'); }
function lint() {
  const a = cssOf(A), b = cssOf(B), errs = [];
  // keyed by selector, so deleting a whole dead rule is allowed but dropping a prefixed line from a
  // rule that still exists (e.g. "-webkit-backdrop-filter" next to "backdrop-filter") is not.
  const prefixed = s => { const m = new Map(); for (const r of s.matchAll(/([^{}]+)\{([^{}]*)\}/g)) { const sel = r[1].trim().replace(/\s+/g, ' '); for (const x of r[2].matchAll(/(-(?:webkit|moz|ms)-[\w-]+)\s*:\s*([^;}]+)/g)) { const k = sel + ' { ' + x[1] + ': ' + x[2].trim().replace(/\s+/g, ' ') + ' }'; m.set(k, (m.get(k) || 0) + 1); } } return m; };
  const selsOf = s => new Set([...s.matchAll(/([^{}]+)\{[^{}]*\}/g)].map(r => r[1].trim().replace(/\s+/g, ' ')));
  const pa = prefixed(a), pb = prefixed(b), sb = selsOf(b); let wholeRuleDrops = 0;
  for (const [k, n] of pa) { const sel = k.slice(0, k.indexOf(' { ')); if (!sb.has(sel)) { wholeRuleDrops++; continue; } if ((pb.get(k) || 0) < n) errs.push(`vendor-prefixed declaration removed from a rule that still exists (${n} -> ${pb.get(k) || 0}): ${k}`); }
  if (wholeRuleDrops) console.log(`info: ${wholeRuleDrops} vendor-prefixed declaration(s) left with whole rules that were deleted`);
  const frames = s => { const m = new Map(); const re = /@(?:-webkit-)?keyframes\s+([\w-]+)\s*\{/g; let x; while ((x = re.exec(s))) { let d = 1, i = re.lastIndex; while (d && i < s.length) { if (s[i] === '{') d++; else if (s[i] === '}') d--; i++; } m.set(x[0].replace(/\s+/g, ' ') , s.slice(re.lastIndex, i).replace(/\s+/g, '')); } return m; };
  const fa = frames(a), fb = frames(b);
  for (const [k, v] of fa) if (fb.get(k) !== v) errs.push(`@keyframes changed or removed: ${k}`);
  const mixed = s => new Set([...s.matchAll(/(^|[{}])\s*([^{}@]+)\{/g)].map(x => x[2].trim().replace(/\s+/g, ' ')).filter(sel => /:{1,2}-(webkit|moz|ms)-/.test(sel) && sel.split(/,(?![^(]*\))/).length > 1));
  const ma = mixed(a); for (const sel of mixed(b)) if (!ma.has(sel)) errs.push(`new selector list mixes a vendor pseudo with other selectors: ${sel.slice(0, 140)}`);
  const stat = s => ({ lines: s.split('\n').length, important: (s.match(/!\s*important/g) || []).length, media: (s.match(/@media\b/g) || []).length });
  console.log(`CSS ${A}: ${JSON.stringify(stat(a))}  ->  ${B}: ${JSON.stringify(stat(b))} (comments stripped)`);
  if (errs.length) console.log('LINT ERRORS\n  ' + errs.join('\n  ')); else console.log('lint: ok');
  return errs.length;
}
const lintErrors = lint();
function decode(buf) { // 8-bit RGB/RGBA, non-interlaced (what Chrome emits)
  let o = 8, w, h, ct, idat = [];
  while (o < buf.length) { const len = buf.readUInt32BE(o), t = buf.toString('ascii', o + 4, o + 8), d = buf.slice(o + 8, o + 8 + len); if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; } else if (t === 'IDAT') idat.push(d); o += 12 + len; }
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, px = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = Buffer.from(raw.slice(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let x = 0; x < stride; x++) { const a = x >= bpp ? line[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0; let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      line[x] = v & 255; }
    for (let x = 0; x < w; x++) { px[(y * w + x) * 4] = line[x * bpp]; px[(y * w + x) * 4 + 1] = line[x * bpp + 1]; px[(y * w + x) * 4 + 2] = line[x * bpp + 2]; px[(y * w + x) * 4 + 3] = 255; }
    prev = line;
  }
  return { w, h, px };
}
function encode(w, h, px) {
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const NOISE_PX = +(process.env.NOISE_PX || 16); let noise = 0;
let total = 0, changed = 0; const report = [];
for (const vp of fs.readdirSync(path.join(root, A)).filter(d => /^\d+x\d+(@\d+)?$/.test(d))) {
  const da = path.join(root, A, vp), db = path.join(root, B, vp); if (!fs.existsSync(db)) { report.push(`MISSING vp ${vp} in ${B}`); changed++; continue; }
  for (const f of fs.readdirSync(da).filter(f => f.endsWith('.png'))) {
    total++; const pa = path.join(da, f), pb = path.join(db, f);
    if (!fs.existsSync(pb)) { report.push(`MISSING ${vp}/${f}`); changed++; continue; }
    const ba = fs.readFileSync(pa), bb = fs.readFileSync(pb);
    const ja = path.join(da, f.replace('.png', '.css.json')), jb = path.join(db, f.replace('.png', '.css.json'));
    let cssDiff = [];
    if (fs.existsSync(ja) && fs.existsSync(jb)) { const ca = JSON.parse(fs.readFileSync(ja)), cb = JSON.parse(fs.readFileSync(jb));
      for (const k of new Set([...Object.keys(ca), ...Object.keys(cb)])) { if (!ca[k] || !cb[k]) { cssDiff.push(`${k}: ${ca[k] ? 'gone' : 'new'}`); continue; } for (const p of Object.keys(ca[k])) if (ca[k][p] !== cb[k][p]) cssDiff.push(`${k} ${p}: ${ca[k][p]} -> ${cb[k][p]}`); } }
    if (ba.equals(bb) && !cssDiff.length) continue;
    const ia = decode(ba), ib = decode(bb); let n = 0;
    if (ia.w !== ib.w || ia.h !== ib.h) { report.push(`SIZE ${vp}/${f} ${ia.w}x${ia.h} -> ${ib.w}x${ib.h}; css diffs ${cssDiff.length}: ${cssDiff.slice(0, 5).join(' ; ')}`); changed++; continue; }
    const out = Buffer.from(ia.px);
    for (let i = 0; i < ia.px.length; i += 4) if (ia.px[i] !== ib.px[i] || ia.px[i + 1] !== ib.px[i + 1] || ia.px[i + 2] !== ib.px[i + 2]) { n++; out[i] = 255; out[i + 1] = 0; out[i + 2] = 255; } else { out[i] = (out[i] + 510) / 3; out[i + 1] = (out[i + 1] + 510) / 3; out[i + 2] = (out[i + 2] + 510) / 3; }
    if (!n && !cssDiff.length) continue;
    if (!cssDiff.length && n <= NOISE_PX) { noise++; continue; } // backdrop-blur raster jitter seen in A/A runs
    changed++; const dd = path.join(root, `diff_${A}_${B}`, vp); fs.mkdirSync(dd, { recursive: true }); if (n) fs.writeFileSync(path.join(dd, f), encode(ia.w, ia.h, out));
    report.push(`DIFF ${vp}/${f}: ${n} px; css diffs ${cssDiff.length}${cssDiff.length ? ': ' + cssDiff.slice(0, 6).join(' ; ') : ''}`);
  }
}
console.log(report.join('\n')); console.log(`${total} screens, ${changed} changed, ${noise} within raster noise (<=${NOISE_PX}px, identical computed styles)`);
process.exit(changed || lintErrors ? 1 : 0);
