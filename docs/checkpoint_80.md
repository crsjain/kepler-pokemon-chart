# CHECKPOINT 80

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Ignore `pglite-debug.log` in `.gitignore`** (`16933c6`): deleted the empty `pglite-debug.log` created by `firebase-tools 15.24.0` and added `pglite-debug.log` to `.gitignore` so emulator runs no longer dirty the working tree.
- [x] **Badge Case & Partner Shop type filter sort order** (`16933c6`, `9d5de6f`): both `#badges-filter-type` and `#shop-filter-type` keep `All Types` and the 4 starter elements (`Grass 🌿`, `Fire 🔥`, `Water 💧`, `Electric ⚡`) at the top, followed by the remaining 14 types sorted alphabetically A–Z (`Bug 🐛`, `Dark 🌙`, `Dragon 🐲`, `Fairy ✨`, `Fighting 🥊`, `Flying 🦅`, `Ghost 👻`, `Ground 🏔️`, `Ice ❄️`, `Normal 🔘`, `Poison ☠️`, `Psychic 🔮`, `Rock 🪨`, `Steel ⚙️`).
- [x] **Remove redundant `"Sort: Type ⚡"` from Partner Shop** (`9003d16`): removed `<option value="type">Sort: Type ⚡</option>` from `#shop-sort-by` in `index.html` and the unused `sortBy === 'type'` branch in `shop.js`, aligning Partner Shop sorting (`Sort: No. 🔢`, `Sort: A-Z 🔤`) with the Badge Case.
- [x] **Sunday removal-day tick edge case in `isTaskActiveInWeek`** (`16933c6`): when an activity is ticked and then soft-deleted on the first day of the week (`deletedAt === weekStartDate`, e.g. Sunday), `isTaskActiveInWeek` now checks `!isTaskOffPlan(task, wStartStr)` so the row stays on that week's chart per Owner Decision 2A.
- [ ] **Prod acceptance (carried): Kepler's Thursday star.** Admin › Settings › `✏️ Fix Oct 11 - 17` → tick Thu Math → Star Vault streak Wed 10/14 → Fri 10/16.

### Known Follow-ups / Nice-to-haves

- [ ] **§7 Phase 3: remove `adminPassword` from per-child state (V20).** Earliest **2026-10-26**; re-verify the doc field in the Firebase console first. TC116 reserved.
- [ ] **Mega slot "?" edge**: `awardCurrentWeeklyBadge` doesn't push a badge that is already collected, so `megaWeeks` can outrun `collectedBadges` and a Mega slot shows "?" (seen only with bad test data so far).
- [ ] **Claimed-rewards history shows stored values** (e.g. `Dessert Outing`), not list labels (carried).
- [ ] **Test data expires**: the T1–T6 code targets the week of Oct 18–24; regenerate with `make_test_family.py <Sunday>`.
- [ ] Carried: real-Firebase sign-out check, parent-device toggle, stale-module error on localhost, viewport sweep, "Rest whole day", historical task order after reorder, kid-side inline styles (Rule 8), `viewport-fit=cover`, Chart Style PRD, logged-in manual check, test-harness sleep savings.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v236`**. Asset tags: `style.css?v=11.03`, `app.js?v=11.06` (+ all 14 importmap entries `?v=11.06`), `particles.js?v=10.4`.
*   **Admin Password**: family Parent PIN at `users/{uid}.adminPassword` (legacy fallback `"zxcv"`).
*   **Local Server URL**: `http://localhost:8000/`. Emulator login `crsjain+staging@gmail.com` / `food3333`.
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Test Suite**: **113 blocks, 112 unique numbers** (`dupes:12`; gaps 40, 43, 44; max **126**; TC116 reserved; next free **127**). `node run_headless_tests.js` ~35.9 s.

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 64 §3](checkpoint_64.md). **No schema or migration changes in this session.**

---

## 4. Work Accomplished

### Badge Case & Partner Shop Filter / Sort Alignment
* **`index.html`**:
  - Ordered the remaining 14 non-starter types alphabetically (`Bug` through `Steel`) after `All Types` and the 4 starter types (`Grass`, `Fire`, `Water`, `Electric`) in both `#badges-filter-type` and `#shop-filter-type`.
  - Removed `<option value="type">Sort: Type ⚡</option>` from `#shop-sort-by`.
* **`shop.js`**:
  - Removed the unused `else if (sortBy === 'type')` sorting branch from `showBrowse()`.
* **`README.md`**:
  - Updated the Partner Shop filter/sort feature bullet to reflect the new type ordering and removal of `Sort: Type ⚡`.

### Activity Deletion on Week-Start Day (`isTaskActiveInWeek`)
* **`app.js`**:
  - Updated `isTaskActiveInWeek(task, weekStartStr)` so a task soft-deleted on `weekStartStr` (`deletedDate === wStartStr`) remains active in that week when `!isTaskOffPlan(task, wStartStr)` (i.e. the child already ticked it on the removal day, per Owner Decision 2A).

### Repo Hygiene & Regression Tests
* **`.gitignore`**:
  - Added `pglite-debug.log` alongside `firebase-debug.log` and `firestore-debug.log`.
* **`tests.js`**:
  - Updated TC91 (`Badge Case & Partner Shop UX`) to assert the exact 19-option order (`all`, 4 starters, 14 A–Z types) on both `#badges-filter-type` and `#shop-filter-type`, and to assert that `option[value="type"]` is absent from `#shop-sort-by`.

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_80.md`](checkpoint_80.md): this checkpoint.

### Edited Files
* [`.gitignore`](../.gitignore): added `pglite-debug.log`.
* [`index.html`](../index.html): ordered non-starter types A–Z in `#badges-filter-type` and `#shop-filter-type`, removed `Sort: Type ⚡` from `#shop-sort-by`, bumped `?v=11.06` across `app.js` and `<script type="importmap">`.
* [`shop.js`](../shop.js): removed unused `sortBy === 'type'` branch.
* [`app.js`](../app.js): preserved week-start-deleted tasks in `isTaskActiveInWeek` when ticked on the removal day.
* [`service-worker.js`](../service-worker.js): bumped `CACHE_NAME` to `poke-chart-cache-v236`.
* [`tests.js`](../tests.js): added type-option order assertions for Badge Case and Partner Shop and asserted absence of `option[value="type"]` in `#shop-sort-by`.
* [`README.md`](../README.md): updated Partner Shop filter/sort bullet.

---

## 6. Validation Instructions

1. **Cache**: hard-refresh the live site and confirm `poke-chart-cache-v236`.
2. **Badge Case & Partner Shop dropdowns**:
   - Open **🏆 Case** and verify the type dropdown lists `All Types`, `Grass 🌿`, `Fire 🔥`, `Water 💧`, `Electric ⚡`, followed by `Bug 🐛` through `Steel ⚙️` in alphabetical order.
   - Open the **Partner Shop** (`🏪`) and verify `#shop-filter-type` has the identical order, and `#shop-sort-by` shows only `Sort: No. 🔢` and `Sort: A-Z 🔤`.
3. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass (113 blocks).
