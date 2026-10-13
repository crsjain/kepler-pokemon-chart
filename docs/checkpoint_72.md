# CHECKPOINT 72

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Badge Case UX: Staff UX Designer recommendations 1 & 2 (`d100ae1`)**: crsjain: *"Apply UX designer recommendations 1 (with Sort: Newest) & 2. Don't implement 3 - I want to keep the wood palette for badge case and task guide."*
  - `Sort: Date Earned 📅` → **`Sort: Newest 📅`**. The Type filter and Sort dropdowns now sit **side-by-side** on mobile (`flex: 1 1 calc(50% - 4px)`), stacking only below 340px.
  - Added a live collection subtitle (`#badges-case-subtitle`: "You have collected **N** Gym Badge(s)!", singular/plural aware) and a top-right `×` (`#close-badges-x-btn`), matching Partner Shop and Star Vault.
  - **Not done (owner decision):** unifying the Badge Case / Task Guide wood palette (`#fdf6e2` / `#8b5a2b`) with the white `.pixel-card` shell. Keep the wood palette.
- [x] **Multi-viewport UX sweep (`d100ae1`)**: crsjain asked whether to run a comprehensive UX review or keep fixing issues ad hoc, then chose *"kick-off the multi-viewport UX sweep."* An automated CDP geometry sweep checked the dashboard, mini-HUD, Exception dock, 11 modals and all 5 Admin tabs at 6 viewports (375×667, 390×844, 430×932, 667×375, 768×1024, 1180×820). It now reports **0 issues** after these fixes:
  - Partner Shop: `.shop-title` overlapped the `×` at 390px, and 🏪 wrapped alone at 375px. Added `padding: 0 28px` and mobile sizing.
  - Task Guide: 📖 wrapped alone on phones, and `#close-guide-modal-btn` had an inline style (Rule 8). Removed the inline style, added a top-right `×` (`#close-guide-x-btn`), and added mobile sizing.
  - Landscape phones (`max-height: 500px`): the Badge Case grid was squeezed to 55px. Added compaction for the Badge Case and Task Guide.
  - Partner Showcase: added `flex-shrink: 0` to `.showcase-sprite-stage`.
  - Admin › Settings: "Mountain (US & Canada)" was clipped. Selects widened from 220px to 236px.
- [x] **Earlier this session (already deployed with Checkpoint 71, `f73dffb`)**: fixed the Badge Case Sort dropdown overlapping cards on mobile (flex-shrink collapse) and the mismatched select border colours (equal-specificity cascade).
- [x] **Environments & logins question**: answered from `firebase.js` and `emulator_data/auth_export/accounts.json`. Emulator login: `crsjain+staging@gmail.com` / `food3333`. Staging: `?useStaging=true`. Production: `?useProd=true`. A standalone environments doc no longer exists in `docs/`; an old copy survives only as a past session artifact (`staging_setup_guide.md`). It was **not** recreated in the repo because the repo is public and the doc contains passwords.
- [ ] **Passcode system revamp**: crsjain: *"My parent passcode and the family login passcode is different in my local environment. That isn't intuitive, and I don't think I can change my family login passcode."* The owner will start the evaluation in a **new thread**, using a prompt provided this session. No code changed yet.

### Known Follow-ups / Nice-to-haves

- [ ] **Passcode revamp evaluation** (new, above): map family login vs. parent passcode (`state.adminPassword`, default `zxcv`, copied to every profile by `saveAdminPasswordToCloud`), then recommend a simpler model.
- [ ] **Stale-module error on localhost**: after the Firebase emulator restart, crsjain saw `'./pokemon_data.js' does not provide an export named 'STARTER_PIKACHU_INSTANCE_ID'`. The server is serving the current files (the export exists and the suite is green), so this is a stale service worker or browser cache in that tab. A hard reload or clearing site data fixes it. If it happens again after one reload, look at why `__tryStaleModuleReload` hit its 60s lockout.
- [ ] **Add the viewport sweep to the toolchain**: the sweep script lives only in session scratch (`~/.gemini/jetski/brain/46da1e2a-.../scratch/viewport_ux_sweep.js`). Consider promoting it to the repo (e.g. `run_viewport_sweep.js`) so it can run before each wrap-up.
- [ ] **Emulator persistence** (carried): add a periodic `firebase emulators:export ./emulator_data`, and find out why the `.agents/sidecars/firebase_emulator` sidecar wasn't running the emulator (it was down again this session and was restarted manually).
- [ ] **"Rest whole day" shortcut in Exception Mode** (carried).
- [ ] **Historical week task order after a reorder** (carried).
- [ ] **Remaining kid-side inline styles (Rule 8)** (carried): the debug sidebar, the header Guide button, and the login / add-profile modal fields. The Task Guide close button is now fixed.
- [ ] **`viewport-fit=cover` safe-area** (carried).
- [ ] **Chart Style (under 5)** (carried): needs its own PRD first.
- [ ] **Logged-in manual check** (carried): per-child reset and the Activities merge-by-id save against real Firestore.
- [ ] **Test-harness sleep savings** (carried): ~8s.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v207`** / Asset tags `style.css?v=10.93`, `app.js?v=10.81` (+ all 14 `<script type="importmap">` entries `?v=10.81`), `particles.js?v=10.4`
*   **Admin Password**: `"zxcv"`
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`). Emulator family login is in `emulator_data/auth_export/accounts.json`.
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Audio/Volume Settings**: Unchanged.
*   **Test Suite**: **97 blocks, 96 unique numbers** (`dupes:12` expected; gaps `40, 43, 44` are historical; max **109**, next free **110**). Run via `node run_headless_tests.js` (**~31–36 s**).

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 64 §3](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_64.md). **No new persisted field and no migration.** The badge count subtitle is derived from `state.collectedBadges.length`.

---

## 4. Work Accomplished

### Badge Case UX alignment
* **`index.html`**: `#close-badges-x-btn`, `#badges-case-subtitle` (`#badges-collected-count`, `#badges-collected-word`), and the `Sort: Newest 📅` label.
* **`badges.js`**: binds the `×` button once in `initBadgeCase()`. `renderBadgeCaseGrid()` updates the count and the singular/plural word.
* **`style.css`**: wood-palette `.badges-close-x-btn` and `.badges-subtitle`. Side-by-side selects (`min-width: 0`), stacked below 340px. Mobile spacing, plus `@media (max-height: 500px)` compaction.

### Multi-viewport sweep fixes
* **`index.html` / `guide.js`**: `#close-guide-x-btn`. Removed the inline `style` from `#close-guide-modal-btn` (now `.guide-close-btn`).
* **`style.css`**: Task Guide header/subtitle/close spacing with mobile and landscape rules. `.shop-title` padding and mobile sizing. `.showcase-sprite-stage { flex-shrink: 0 }`. `#admin-pane-today` selects at 236px.

### Tests
* **TC108 (expanded)**: `Sort: Newest 📅` label, `8 Gym Badges` / `1 Gym Badge` subtitle, `×` closes the modal, side-by-side selects at a 350px modal width, plus the existing stacked-fallback no-overlap checks.
* **TC109 (new)**: Task Guide has no inline styles and its `×` works. The Partner Shop title has ≥24px padding and clears the `×` at 390px. The Showcase stage has `flex-shrink: 0`. The Admin timezone select is 236px on desktop (the modal pop-in animation is finished before measuring).

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_72.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_72.md): this checkpoint.

### Edited Files
* [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html): Badge Case `×` and subtitle, `Sort: Newest 📅`, Task Guide `×`, inline style removed, cache tags bumped.
* [`badges.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/badges.js): `×` binding and live badge count.
* [`guide.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/guide.js): `×` binding.
* [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css): Badge Case, Task Guide, Partner Shop, Showcase and Admin Settings responsive fixes.
* [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): `CACHE_NAME` → `poke-chart-cache-v207`.
* [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): TC108 expanded, TC109 added.
* [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md) & [`docs/prd_badge_collection.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_badge_collection.md): Badge Case subtitle, `×`, `Newest` sort, side-by-side mobile controls.

---

## 6. Validation Instructions

1. **Cache**: hard-refresh `https://crsjain.github.io/kepler-pokemon-chart/` and confirm `poke-chart-cache-v207` (`style.css?v=10.93`, modules `?v=10.81`). If a "does not provide an export named" banner appears, reload once more or clear site data.
2. **Badge Case (phone)**: open **🏆 Case**. Check that the subtitle reads "You have collected N Gym Badges!", that `All Types` and `Sort: Newest 📅` share one row, that the top-right `×` closes the modal, and that the wood palette is unchanged.
3. **Badge Case (phone landscape)**: the badge grid has room to scroll at least one row of cards.
4. **Task Guide (phone)**: the title "Pokémon Training Guide 📖" doesn't leave 📖 alone on a line, the top-right `×` closes it, and "Done Reading" still works.
5. **Partner Shop (390px phone)**: the title doesn't touch the `×`.
6. **Admin › Settings**: pick "Mountain (US & Canada)" in Time zone. The text is not clipped.
7. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass (97 blocks, 96 unique, including TC108 and TC109).
