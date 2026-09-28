# CHECKPOINT 67

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Fix stale ES module error on app open (`Uncaught SyntaxError: The requested module './pokemon_data.js' does not provide an export named 'getStageIndexForLevel'`) (`1025fbb`)**:
  - **Root cause**:
    1. Only the entry `<script type="module" src="app.js?v=...">` carried a `?v=` query string; all 12 sub-modules (`./pokemon_data.js`, `./state.js`, `./migrations.js`, etc.) were imported by bare relative path with no query string. On any browser still controlled by a pre-Checkpoint-63 cache-first Service Worker (`<= v172`, which only bypassed `CacheStorage` when `url.search` was non-empty) or consulting the 10-minute HTTP disk cache without an active network-first SW, `app.js?v=10.55` was fetched fresh while `./pokemon_data.js` was served stale from cache. Because module linking fails before `app.js` executes, `navigator.serviceWorker.register('./service-worker.js')` in `app.js` never ran to upgrade the old Service Worker.
    2. `window.__tryStaleModuleReload()` in `index.html` called `reg.update().then(reload, reload)`, which triggered `window.location.reload()` as soon as `reg.update()` resolved (while the new worker was still in `installing` downloading `ASSETS_TO_CACHE` via `cache.addAll`), before `activate`/`clients.claim()`, and without unregistering the stale Service Worker or wiping `CacheStorage`. The immediate reload hit the same stale cache a second time within the 60-second `staleModuleReloadAt` lockout window and rendered the red `⚠️ JavaScript Error` banner.
    3. `app.js` also reloaded prematurely on `newWorker.state === 'installed'` (before `activate` deleted old caches and claimed clients).
  - **Fix**:
    1. Added `<script type="importmap">` in `<head>` of `index.html` mapping all 13 local ES modules (`./app.js`, `./state.js`, `./firebase.js`, `./migrations.js`, `./vault.js`, `./badges.js`, `./shop.js`, `./guide.js`, `./pokemon_data.js`, `./date_utils.js`, `./admin.js`, `./rewards_admin.js`, `./audio.js`) to `./<module>.js?v=10.57` so every `import ... from './...'` across the module graph carries `?v=10.57` on the wire (busting both `<= v172` SW caches and HTTP disk caches on first load).
    2. Added `window.__clearStaleModuleCaches()` in `index.html` to unregister all Service Worker registrations and delete all `CacheStorage` keys before `window.__tryStaleModuleReload()` reloads the page, plus a `controllerchange` listener fallback.
    3. Updated `app.js` to wait for `newWorker.state === 'activated'` before reloading, and broadened `isLocalAsset` in `service-worker.js` to match any same-origin `.js/.css/.html/.json` path.
    4. Expanded **TC90** in `tests.js` to enforce `<script type="importmap">` coverage and `?v=` parity across all ES modules in `ASSETS_TO_CACHE`, verify live versioned resource fetches via `performance.getEntriesByType('resource')`, and unit-test `window.__clearStaleModuleCaches()`.

### Known Follow-ups / Nice-to-haves

- [ ] Carried: **Chart Style (under 5)** feature needs its own PRD before it's built (the D8 placeholder `#admin-chart-style-placeholder` sits at the top of `✅ Activities`).
- [ ] Carried: **Hold-to-unlock for the reset button** (Rule 6).
- [ ] Carried: logged-in manual check of the per-child reset against real Firestore.
- [ ] Carried: ~8 s zero-risk harness savings (assessment §6.1).

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: `v1.10.27` / Service Worker cache **`poke-chart-cache-v179`** / Asset tags `style.css?v=10.66`, `app.js?v=10.57` (+ `<script type="importmap">` `?v=10.57`), `particles.js?v=10.3`
*   **Admin Password**: `"zxcv"`
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`)
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths, never `git add -A`.
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Audio/Volume Settings**: Unchanged.
*   **Test Suite**: **83 blocks, 82 unique numbers** (`dupes:12` expected; gaps `40, 43, 44` historical; max **95**, next free **96**). **~27 s.**

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 64 §3](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_64.md). No new persisted field and no migration.

---

## 4. Work Accomplished

### Full-Graph ES Module Cache Busting & Stale-Module Self-Heal (`1025fbb`)
* **`index.html`**: Added `<script type="importmap">` in `<head>` mapping all 13 local ES modules to `?v=10.57`, bumped `app.js?v=10.57`, added `window.__clearStaleModuleCaches(swContainer, cacheStorage)` to unregister all Service Workers and wipe `CacheStorage` before `window.__tryStaleModuleReload()` reloads, and broadened `window.__isStaleModuleError`.
* **`app.js`**: Changed the Service Worker `statechange` listener to reload only once `newWorker.state === 'activated'` (never prematurely on `'installed'`).
* **`service-worker.js`**: Bumped `CACHE_NAME` to `poke-chart-cache-v179` and broadened `isLocalAsset` to match any same-origin `.js/.css/.html/.json` path so newly added modules are served network-first (`cache: 'no-cache'`) even before the new worker's `ASSETS_TO_CACHE` list activates.
* **`tests.js`**: Expanded **TC90** to assert that `<script type="importmap">` appears before `<script type="module">`, maps every ES module in `ASSETS_TO_CACHE` with the exact same `?v=` version as `app.js`, causes the live browser to fetch imported sub-modules with `?v=<appVer>` in `performance.getEntriesByType('resource')`, and unregisters SWs + deletes caches in `window.__clearStaleModuleCaches()`.
* **`_agents/AGENTS.md` & `_agents/skills/pokemon-session-wrapup/SKILL.md`**: Updated cache-busting instructions (§6.1 and wrap-up §2) to document `<script type="importmap">` version parity with `app.js?v=`.

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_67.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_67.md): This checkpoint document.

### Edited Files
* [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html): `<script type="importmap">` for all 13 local ES modules (`?v=10.57`), `app.js?v=10.57`, `window.__clearStaleModuleCaches()`, updated `window.__tryStaleModuleReload()` and `window.__isStaleModuleError()`.
* [`app.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js): Wait for `newWorker.state === 'activated'` before reloading on SW updates.
* [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): Bumped `CACHE_NAME` to `poke-chart-cache-v179` and broadened `isLocalAsset` to match any same-origin `.js/.css/.html/.json` asset.
* [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): Expanded TC90 with importmap coverage/version parity, live resource URL checks, and `__clearStaleModuleCaches()` unit test.
* [`_agents/AGENTS.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/AGENTS.md): Updated §6.1 cache-busting rules for `<script type="importmap">`.
* [`_agents/skills/pokemon-session-wrapup/SKILL.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/skills/pokemon-session-wrapup/SKILL.md): Updated §2 cache invalidation check for `<script type="importmap">`.

---

## 6. Validation Instructions

1. **Production / Local Cache**: Hard-refresh `https://crsjain.github.io/kepler-pokemon-chart/` (or `http://crsjain.c.googlers.com:8000/`) and confirm `poke-chart-cache-v179` and that DevTools Network shows `pokemon_data.js?v=10.57`, `state.js?v=10.57`, etc.
2. **Automated Suite**: Run `node run_headless_tests.js`; verify 100% pass (83 blocks, 82 unique numbers, including expanded TC90).
