# CHECKPOINT 63

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Prod `SyntaxError: The requested module './state.js' does not provide an export named 'buildWipedChildState'`**: root-caused to the service worker's cache-first policy for bare module imports (`./state.js`) when only the entry `<script src="app.js?v=...">` carries a version query. Fixed by making same-origin local assets **network-first** (`fetch(req, { cache: 'no-cache' })` with cache update and offline fallback) while keeping PokeAPI sprites cache-first, plus an inline one-shot stale-module reload guard in `index.html`. Covered by **TC90**.
- [x] **Badge Case sorting & filtering ("add sorting functions for a to z, dex # and pokémon type… same as the sort functions in the Pokemon shop")**: replaced the two toggle buttons with the Shop's `.shop-filter-bar` (`#badges-filter-type` with all 18 types incl. newly added `Flying 🦅` + `#badges-sort-by` with Date Earned, Dex #, A–Z, and Type, with Dex # as tiebreaker). Also added `Sort: Type ⚡` and `Flying 🦅` to the Partner Shop. Badge cards remain unchanged (`sprite`, `name`, `#Dex`). Covered by **TC91** and updated **TC11**.
- [x] **Partner Shop name truncation (Charmander, etc.) & card vertical spacing**:
  - Moved the `✨` can-evolve marker out of `.shop-item-name` into the card's top-left corner and widened the shop modal (`max-width: 650px`, grid `minmax(112px, 1fr)`), eliminating truncation across all buyable Pokémon (asserted by **TC91 Part H**).
  - After a Staff UX review of the card spacing, added a **26px top status rail** anchored to `.shop-item-card` (`✨` top-left, `🔒` top-right, **64px** sprite, compact `4px` name/price rhythm), and **dropped the duplicate Poké Ball stamp on caught cards** per user preference (`CAUGHT!` / `CAUGHT ×N` ribbon is now the sole caught signal, overriding Checkpoint 46's dual-badge design). Covered by **TC94** (`cardRect.height <= cardRect.width * 1.25`) and updated **TC47** / **TC76**.
- [x] **Remove the Pikachu / "Kepler" placeholder flash on cold open (Option 1 only)**: stripped hard-coded Pikachu (`25.png`), `"Pikachu"`, `"Kepler"`, and `"Loading Week..."` from `index.html`; added `body.app-booting` in-place skeleton (wobbling CSS Pokéball, `"Finding your partner..."`, neutral grey level/XP placeholders, zero layout shift) cleared by `markAppReady()` across all 7 boot-ending paths, plus a **10s retry watchdog** (`"Can't reach the Pokémon Center 📡"` + `Try Again 🔄` $\ge 42\text{px}$). User chose **Option 1 only**; Option 2 (Firestore persistent IndexedDB cache) was explicitly dropped. Covered by **TC92**.
- [ ] **Admin Redesign implementation** is still awaiting approval of `docs/prd_admin_panel_redesign.md` (unchanged from Checkpoint 61; its reserved test number was bumped **TC90 → TC93**).

### Known Follow-ups / Nice-to-haves

- [ ] **Real-device verification of the SW fix**: open the deployed GitHub Pages app on the kids' tablet / phone and confirm the new `poke-chart-cache-v173` worker activates cleanly with no stale-module error.
- [ ] **Optional `✨` "can evolve" affordance revisit**: in Pokémon canon `✨` means Shiny, and its `"Can evolve! ✨"` explanation lives only in a hover `title` attribute (invisible on touch tablets). Out of scope for the spacing fix; revisit only if the kids find it confusing.
- [ ] Carried: **Chart Style (under 5) feature itself** needs its own PRD and `feature-review-panel` run before building.
- [ ] Carried: **Wipe button label** ("Wipe All Progress (Reset)") and **Hold-to-unlock for Wipe** (Rule 6), from the Admin Redesign PRD.
- [ ] Carried: **Admin Redesign** PRD §8 phases, pending approval (reserved test number is now **TC93**; next free test number is **TC95**).
- [ ] Carried: **Logged-in manual check** of per-child Wipe against real Firestore (Checkpoint 62 §6).
- [ ] Carried: ~8 s zero-risk harness savings (`docs/refactoring_assessment_2026_09_12.md` §6.1).

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: `v1.10.24` / Service Worker cache **`poke-chart-cache-v173`** / Asset tags **`style.css?v=10.64`**, **`app.js?v=10.54`**, `particles.js?v=10.3`
*   **Admin Password**: `"zxcv"`
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`)
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths, never `git add -A`.
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Audio/Volume Settings**: Unchanged.
*   **Test Suite**: **81 blocks, 80 unique numbers** (`dupes:12` expected; gaps `40, 43, 44` historical; `93` reserved by `docs/prd_admin_panel_redesign.md`; max **94**, next free **95**). Run via `node run_headless_tests.js` (**27.9 s**).

---

## 3. Active V18 State Schema

Unchanged from [Checkpoint 58 §3](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_58.md).

> [!NOTE]
> Schema stays **V18**, and no migration was needed. Badge Case filter/sort state, Partner Shop sort state, and the `body.app-booting` skeleton lifecycle are all transient UI state.

---

## 4. Work Accomplished

### Service Worker Network-First Module Fetching & Stale-Module Self-Heal (`70d2d7f`)

* **`service-worker.js`**: split the `fetch` listener into two strategies:
  - **PokeAPI sprites (`raw.githubusercontent.com`)**: remain **cache-first** so 100+ artwork PNGs never re-download.
  - **Same-origin local assets (`index.html`, `app.js`, `state.js`, `style.css`, etc.)**: now **network-first** with `fetch(event.request, { cache: 'no-cache' })`, updating `CACHE_NAME` on 200 OK and falling back to the cached copy (or `{ url, ignoreSearch: true }` for `?v=` URLs) only when offline. Non-GET and unrelated cross-origin requests (Firebase Auth / Firestore) are ignored.
* **`index.html`**: inline `<head>` error listener exposes `window.__isStaleModuleError` and `window.__tryStaleModuleReload`. If an `Uncaught SyntaxError` matching `does not provide an export named` or `Failed to fetch dynamically imported module` fires while online (before `app.js` can register its `controllerchange` listener), it unregisters stale service workers and reloads once per 60 s (`sessionStorage` guard `poke_sw_stale_reload_ts`; bypassed in `?headless=true`).

### Badge Case Filter & Sort Bar Unified with Partner Shop (`1f5a3f2`)

* **`index.html` & `badges.js`**: replaced `#sort-badges-date` / `#sort-badges-dex` buttons with `.shop-filter-bar.badge-case-controls` containing `#badges-filter-type` (`All Types` + 18 elemental types including `Flying 🦅`) and `#badges-sort-by` (`Date Earned 📅` default, `No. 🔢`, `A-Z 🔤`, `Type ⚡`, with Dex # tiebreaker). Reopening the modal resets both controls to `all` / `date`. Filtering to an unearned type shows `"No <Type> badges collected yet. Keep training to earn more! 🏆"`.
* **`shop.js`**: added `Sort: Type ⚡` (alphabetical by `POKEMON_TYPES[id]` with Dex # tiebreaker) and `Flying 🦅` to `#shop-filter-type`.
* **`style.css`**: removed inline styles from `#badges-modal` and `badges.js` (Rule 8), added `.badge-case-controls`, `.no-badges`, `.badges-close-btn`, and transparent scrollbar tracks on `#badges-grid` (Rule 5).

### Partner Shop Card Status Rail, Zero Name Truncation & Caught Badge Cleanup (`aca0249`, `22b4eba`, `4f3f27a`, `c6ef2be`)

* **`shop.js`**: moved `.shop-item-sparkle` out of `.shop-item-name` into `.shop-item-sprite-container` (confirm modal title keeps its inline `✨`). Removed the duplicate `.shop-item-pokeball-badge` on caught cards so the `CAUGHT!` / `CAUGHT ×N` ribbon is the sole caught indicator; `🔒` renders only on uncaught locked cards.
* **`style.css`**:
  - Widened `#pokemon-shop-modal .modal-content` to `max-width: 650px` and `.shop-items-grid` to `minmax(112px, 1fr)` so 10-character names like `Charmander`, `Sprigatito`, and `G. Moltres` never ellipsis-truncate.
  - Made `.shop-item-card` the positioning context (`position: relative; padding: 26px 6px 8px`) with `.shop-item-sprite-container { position: static; width: 64px; height: 64px }`, anchoring `✨` (`top: 6px; left: 7px`) and `🔒` (`top: 5px; right: 7px`) cleanly in the card's top corners above the sprite and clear of the centered `CAUGHT!` ribbon. Deleted the dead `.shop-item-pokeball-badge` / `.shop-item-pokeball-center` CSS blocks.

### Boot Skeleton & 10s Retry Watchdog (`4255cd1`)

* **`index.html`**: starts with `<body class="app-booting">`, neutral `<title>Pokémon Training Chart</title>`, `<span class="trainer-possessive"><span class="trainer-name-label"></span>'s </span>Pokémon Training` header, src-less `#pokemon-sprite`, empty `#partner-name`, and a `#boot-status` block (`"Finding your partner..."`, failed state `"Can't reach the Pokémon Center 📡"`, and `#boot-retry-btn` `"Try Again 🔄"`). Inline `<head>` controller defines `window.__BOOT_WATCHDOG_MS = 10000`, `window.__markAppReady()`, and `window.__showBootFailed()`.
* **`app.js`**: `markAppReady()` helper called from all 7 boot-terminal paths (both profile-picker branches in `handleProfilesUpdate`, `isTestMode` initial render, `!user` login modal, profiles subscription error, first `renderState(true)` in `selectProfile`, and profile snapshot error).
* **`style.css`**: `body.app-booting` hides profile-derived nodes with `visibility: hidden` (preserving card geometry), renders a wobbling CSS Pokéball via `.pokemon-sprite-wrapper::before` (`bootPokeballWobble`, disabled under `prefers-reduced-motion: reduce`), hides dangling `'s ` when `.trainer-name-label:empty`, hides src-less `#pokemon-sprite`, and enforces `min-height: 42px` on `.boot-retry-btn` (Rule 17).

### Tests & Documentation

* **`tests.js`**: updated **TC11**, **TC47**, **TC76**; added **TC90** (SW fetch sandbox), **TC91** (Badge Case + Shop filter/sort + zero shop name truncation), **TC92** (boot skeleton & watchdog), and **TC94** (shop card status rail geometry, no Poké Ball stamp, 64px sprite, `height <= 1.25 * width`).
* **`docs/prd_badge_collection.md`** (§3.2) & **`docs/prd_admin_panel_redesign.md`** (reserved test number bumped to **TC93**).
* **`README.md`**: updated Partner Shop, Badge Case, and PWA / Boot Skeleton bullets.

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_63.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_63.md): this checkpoint.

### Edited Files
* [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): network-first local assets, cache-first sprites, `poke-chart-cache-v173`.
* [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html): stale-module self-heal, boot controller & `#boot-status`, placeholder removal, Badge Case & Shop filter/sort options, `style.css?v=10.64`, `app.js?v=10.54`.
* [`app.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js): `markAppReady()` wired into all boot-ending paths.
* [`badges.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/badges.js): type filter + Date / Dex # / A–Z / Type sort + empty-filter message.
* [`shop.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/shop.js): `Sort: Type ⚡`, corner `✨` inside `.shop-item-sprite-container`, duplicate caught Poké Ball stamp removed.
* [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css): Badge Case filter bar & Rule 5/8 cleanup, 650px shop modal & status-rail card layout, boot skeleton & wobbling Pokéball.
* [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): updated TC11/TC47/TC76; added TC90, TC91, TC92, TC94.
* [`docs/prd_badge_collection.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_badge_collection.md): §3.2 filter/sort spec.
* [`docs/prd_admin_panel_redesign.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_admin_panel_redesign.md): renumbered planned test to TC93.
* [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md): feature bullets.

---

## 6. Validation Instructions

1. **Production & Service Worker (`poke-chart-cache-v173`)**: open `https://crsjain.github.io/kepler-pokemon-chart/` on tablet/phone and desktop. Confirm no `SyntaxError ... buildWipedChildState` banner appears and DevTools → Application → Service Workers shows `poke-chart-cache-v173`.
2. **Boot Skeleton**: hard-reload the app. While Firebase connects, verify the Trainer Card shows a wobbling Pokéball and `"Finding your partner..."` (never Pikachu or `"Kepler"`), then transitions in place to the active child's partner without layout shift.
3. **Badge Case Filter & Sort**: click **🏆 Case** on the Trainer Card. Filter by type (including `Flying 🦅`) and sort by `Date Earned 📅`, `No. 🔢`, `A-Z 🔤`, and `Type ⚡`. Close and reopen; verify it resets to `All Types` + `Date Earned`.
4. **Partner Shop Cards**: open **Change Partner → Pokémon Partner Shop! 🏪**. Verify `Charmander` and `G. Moltres` display on a single line with no `...`, `✨` sits cleanly in the top-left corner rail, locked cards show `🔒` in the top-right, caught cards show only the `CAUGHT!` / `CAUGHT ×N` ribbon (no duplicate Poké Ball), and cards have compact proportions.
5. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass across all 81 test blocks.
