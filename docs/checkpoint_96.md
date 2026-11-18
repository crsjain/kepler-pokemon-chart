# CHECKPOINT 96

This document contains a complete, chronological record of user requests, system
configurations, version progress, and active schema definitions for the
application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **"Increase the rate that the sparkles appear — probably every 5–15 seconds. Right now I can't see them."** (owner, 2026-11-18). `SPARKLE_MIN_MS` 5000 / `SPARKLE_MAX_MS` 15000 in `sparkles.js` (was 20–45 s). Commit `fd602a6`.
- [x] **Wrap-up** (owner).
- [ ] **Owner check on Lyra's tablet after reloading to `v319`**: sparkles every 5–15 s in the pink background. If they're still hard to spot, the next lever is visibility (bigger than 14–24px, stronger glow, longer than 1.6 s), offered but not requested.
- [ ] **Carried from CP95/CP93:** see [Checkpoint 95 §1](checkpoint_95.md) and [Checkpoint 93 §1](checkpoint_93.md) for open owner checks.

### Known Follow-ups / Nice-to-haves

- [ ] **Sparkles pause in idle mode by design**: after the idle timeout (default 10 min) `body.idle-mode` stops all animation so the tablet can sleep, and no sparkles spawn until someone touches the screen. An unattended tablet will show none.
- [ ] **Sparkle spot availability** (probe of 50 random tries per viewport, 2026-11-18): about 60% find a free spot at 1280×800 / 1180×820, about 40% at 800×1280 / 820×1180, and about 18% at 390×844. Each spawn tries 40 points, so tablets always find one.
- [ ] **Chrome 158 on the cloudtop** serializes computed `justify-content: flex-start` as `flow-start`. TC143 now accepts both. Watch for similar serialization asserts elsewhere.
- [ ] Carried: everything in [Checkpoint 95 Known Follow-ups](checkpoint_95.md).

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo), Lyra (5yo) & Alden (under 5)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v319`**. Asset tags: `style.css?v=11.68`, `app.js?v=11.68` + all **16** importmap entries `?v=11.68`, `particles.js?v=10.8`. App label still `v1.8.0 (v58)`.
*   **Admin Password**: family Parent PIN at `users/{uid}.adminPassword` (legacy fallback `"zxcv"`). Never commit backup codes.
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`).
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Test Suite**: **132 blocks, 131 unique numbers** (`dupes:12`; gaps 40, 43, 44; max **145**; TC116 reserved; next free **146**). `node run_headless_tests.js` ~40 s, 3,876 asserts.

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 88 §3](checkpoint_88.md). **No schema bump or migration.**

---

## 4. Work Accomplished

### Princess sparkles every 5–15 s (`fd602a6`)
* **`sparkles.js`**: `SPARKLE_MIN_MS = 5000`, `SPARKLE_MAX_MS = 15000`; header comment records the history (45–90 s → 20–45 s on 2026-11-15 → 5–15 s on 2026-11-18).
* **`style.css`**, **`docs/prd_unicorn_princess_theme.md`** §11, **`README.md`**: copy updated to 5–15 s.
* **`tests.js`**: TC144 pins 5000 / 15000. TC143 accepts `flow-start` (Chrome 158) as well as `flex-start`; it failed at `b672df9` from the browser update alone.
* **Cache**: `v319`, all module tags `11.68`.

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_96.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_96.md): this file.

### Edited Files
* [`sparkles.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/sparkles.js), [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css), [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js), [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html), [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js), [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md), [`docs/prd_unicorn_princess_theme.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_unicorn_princess_theme.md).

---

## 6. Validation Instructions

1. On Lyra's tablet, reload to `v319` (Admin › Data › Reload latest version if stale).
2. Watch the pink background for about 30 s: one to three sparkles should twinkle every 5–15 s, never over a panel. None should appear with a popup open, in Exception Mode, after the idle timeout, or on Kepler's Pokémon chart.
3. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass.
