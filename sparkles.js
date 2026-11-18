// Princess-theme easter egg: every 5–15 s, one to three sparkles twinkle in the open pink
// background around the panels (owner: 45–90 s → 20–45 s on 2026-11-15 → 5–15 s on 2026-11-18, "I can't see them"). Purely decorative: no sound, no taps,
// nothing saved. Skipped for the Pokémon theme, reduced motion, a hidden tab, open modals,
// Exception Mode / Fix last week, idle mode and the boot skeleton.

export const SPARKLE_MIN_MS = 5000;
export const SPARKLE_MAX_MS = 15000;
const SPARKLE_LIFE_MS = 1600;
const SPARKLE_MARGIN = 14; // keep this far from any panel edge

let layer = null;
let timer = null;

// Elements whose background *is* the pink sky. Anything else under a point (panels,
// title text, buttons) means the sparkle would sit on top of content.
const SKY = new Set(['HTML', 'BODY']);
const SKY_CLASSES = ['app-container', 'layout-container', 'game-header'];

function isSky(el) {
  if (!el) return false;
  if (SKY.has(el.tagName)) return true;
  return SKY_CLASSES.some(c => el.classList.contains(c));
}

export function canSparkle() {
  const body = document.body;
  if (!body || body.dataset.theme !== 'unicorn') return false;
  if (document.hidden) return false;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (body.classList.contains('app-booting') || body.classList.contains('idle-mode')) return false; // idle mode lets the tablet sleep
  if (document.querySelector('.modal:not(.hidden)')) return false;
  if (document.querySelector('.layout-container.exception-mode, .layout-container.last-week-edit')) return false;
  return true;
}

// Returns {x, y, size} in the open sky, or null if no spot is free (e.g. a phone with no gutters).
export function pickSparkleSpot(rand = Math.random) {
  const w = window.innerWidth, h = window.innerHeight;
  for (let i = 0; i < 40; i++) {
    const size = 14 + Math.round(rand() * 10);
    const x = Math.round(rand() * w), y = Math.round(rand() * h);
    const r = size / 2 + SPARKLE_MARGIN;
    const probes = [[x, y], [x - r, y], [x + r, y], [x, y - r], [x, y + r]];
    if (probes.every(([px, py]) => px >= 0 && py >= 0 && px < w && py < h && isSky(document.elementFromPoint(px, py)))) {
      return { x, y, size };
    }
  }
  return null;
}

function ensureLayer() {
  if (layer && layer.isConnected) return layer;
  layer = document.createElement('div');
  layer.className = 'bg-sparkle-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  return layer;
}

// Spawns up to `count` sparkles now (if allowed). Returns the elements created.
export function spawnBackgroundSparkles(count = 1 + Math.floor(Math.random() * 3)) {
  if (!canSparkle()) return [];
  const host = ensureLayer();
  const made = [];
  for (let i = 0; i < count; i++) {
    const spot = pickSparkleSpot();
    if (!spot) break;
    const s = document.createElement('span');
    s.className = 'bg-sparkle';
    s.style.setProperty('--x', `${spot.x}px`);
    s.style.setProperty('--y', `${spot.y}px`);
    s.style.setProperty('--s', `${spot.size}px`);
    s.style.setProperty('--d', `${i * 260}ms`);
    const remove = () => s.remove();
    s.addEventListener('animationend', remove, { once: true });
    setTimeout(remove, SPARKLE_LIFE_MS + i * 260 + 400);
    host.appendChild(s);
    made.push(s);
  }
  return made;
}

function schedule() {
  clearTimeout(timer);
  const wait = SPARKLE_MIN_MS + Math.random() * (SPARKLE_MAX_MS - SPARKLE_MIN_MS);
  timer = setTimeout(() => { spawnBackgroundSparkles(); schedule(); }, wait);
}

export function initBackgroundSparkles() {
  if (timer !== null) return; // both boot paths call this
  schedule();
}

export function stopBackgroundSparkles() {
  clearTimeout(timer);
  timer = null;
  if (layer) layer.replaceChildren();
}
