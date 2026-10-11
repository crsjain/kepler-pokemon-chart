# CHECKPOINT 71

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Multi-month week range date not centered on mobile (`938c455`)**: crsjain: *"In mobile, the task chart date is not centered when there is more than one unique month."* When a week spans two months (e.g., `Sep 27 - Oct 3, 2026`), `#week-range-display` wraps onto two lines on mobile viewports; because `.week-range-text` and `.week-nav-center` lacked `text-align: center` (and `.week-navigation-container` had no `gap`), the wrapped text defaulted to `text-align: start` flush against `◀ Prev`. Added `text-align: center` to `.week-nav-center` and `.week-range-text` plus `gap: 8px` to `.week-navigation-container`. Covered by **TC107**.
- [x] **Remove "Sort by Type" from the Pokémon Badge Case (`2086093`)**: crsjain: *"Remove the "Sort by Type" in the pokemon badge case, since there is already a filter for pokemon type."* Removed `<option value="type">Sort: Type ⚡</option>` from `#badges-sort-by` in `index.html`, removed the `sortBy === 'type'` branch in `badges.js`, updated `README.md` and `docs/prd_badge_collection.md` §3.2, and updated **TC91** step `(D)` to assert the option is absent.
- [x] **Badge Case mobile filter/sort overlap & border specificity (`f73dffb`)**: Prevented `.shop-filter-bar` and `.shop-filter-bar.badge-case-controls` from shrinking when wrapping onto two rows in the flex column modal (`flex-shrink: 0` on header/filter/close controls, `min-height: 0` on `.badges-grid-container`, `.guide-list`, and `#shop-items-grid`, `overflow: hidden` on `.badges-modal-content` and `.guide-modal-content`), and raised `.shop-filter-bar.badge-case-controls select` specificity over `.shop-filter-bar select` so both dropdowns share the warm tan border (`#c4a47c`) in their resting state. Covered by **TC108**.

### Known Follow-ups / Nice-to-haves

- [ ] **Emulator persistence** (carried): add a periodic `firebase emulators:export ./emulator_data` (or similar) so an abrupt kill doesn't lose local data, and investigate why the `.agents/sidecars/firebase_emulator` sidecar (`restart_policy: always`) wasn't running it.
- [ ] **"Rest whole day" shortcut in Exception Mode** (carried): tapping a column header in Exception Mode could set the whole day to 💤 at once instead of 2 taps × every activity.
- [ ] **Historical week task order after a reorder** (carried): active tasks in past weeks follow the new `state.tasks` order.
- [ ] **Remaining kid-side inline styles (Rule 8)** (carried): inner kid-modal form controls, the debug sidebar and the header Guide button.
- [ ] **`viewport-fit=cover` safe-area** (carried): deferred until the kid-HUD notch padding can be verified on hardware.
- [ ] **Chart Style (under 5)** (carried): needs its own PRD before it's built.
- [ ] **Logged-in manual check** (carried): per-child reset and Activities merge-by-id save against real Firestore.
- [ ] **Test-harness sleep savings** (carried): ~8 s of zero-risk sleep savings (`docs/refactoring_assessment_2026_09_12.md` §6.1).

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: `v1.10.31` / Service Worker cache **`poke-chart-cache-v206`** / Asset tags `style.css?v=10.92`, `app.js?v=10.80` (+ all 14 `<script type="importmap">` entries `?v=10.80`), `particles.js?v=10.4`
*   **Admin Password**: `"zxcv"`
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`)
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths, never `git add -A`.
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Audio/Volume Settings**: Unchanged.
*   **Test Suite**: **96 blocks, 95 unique numbers** (`dupes:12` expected; gaps `40, 43, 44` are historical; max **108**, next free **109**). Run via `node run_headless_tests.js` (**~35–38 s**).

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 64 §3](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_64.md). **No new persisted field and no migration.**

---

## 4. Work Accomplished

### Mobile Week Navigation Date Centering (`938c455`)
* **`style.css`**: Added `gap: 8px` to `.week-navigation-container` and `text-align: center` to `.week-nav-center` and `.week-range-text` so multi-month date strings that wrap onto two lines on mobile viewports remain horizontally centered between `◀ Prev` and `Next ▶`.

### Badge Case Sort Options Cleanup (`2086093`)
* **`index.html` & `badges.js`**: Removed `<option value="type">Sort: Type ⚡</option>` from `#badges-sort-by` and removed the `sortBy === 'type'` comparator branch in `renderBadgeCaseGrid`, leaving `Date Earned 📅`, `No. 🔢`, and `A-Z 🔤` alongside `#badges-filter-type`.
* **`README.md` & `docs/prd_badge_collection.md`**: Updated Badge Case sort documentation to reflect the three sort modes.

### Badge Case Mobile Flex Layout & Select Border Specificity (`f73dffb`)
* **`style.css`**: Added `flex-shrink: 0` to `.shop-filter-bar`, `.shop-filter-bar.badge-case-controls`, `.badges-modal-content h2`, `.badges-close-btn`, and `.guide-modal-content h2`; added `min-height: 0` to `.badges-grid-container`, `.guide-list`, and `#shop-items-grid`; added `overflow: hidden` to `.badges-modal-content` and `.guide-modal-content`; raised `.shop-filter-bar.badge-case-controls select` specificity so both selects keep `#c4a47c` borders; and tightened `@media (max-width: 480px)` Badge Case modal spacing.

### Tests
* **TC91 step (D)**: Updated to assert `sortSelect.querySelector('option[value="type"]') === null` in the Badge Case while preserving Partner Shop `Sort: Type` coverage in step (G).
* **TC107 (new)**: Verifies `text-align: center` on `#week-range-display` and `.week-nav-center`, and asserts via DOM `Range.getClientRects()` that both wrapped lines of `"Sep 27 - Oct 3, 2026"` are horizontally centered within `.week-navigation-container` at mobile width.
* **TC108 (new)**: Verifies Badge Case filter bar `flex-shrink: 0`, grid `min-height: 0`, warm tan border color (`rgb(196, 164, 124)`) on both dropdowns, and zero overlap when the two dropdowns stack on narrow mobile widths.

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_71.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_71.md): this checkpoint.

### Edited Files
* [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css): mobile week range centering (`text-align: center`, `gap: 8px`) and Badge Case / Guide / Shop flex scroll isolation and select border specificity.
* [`badges.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/badges.js): removed `sortBy === 'type'` branch from `renderBadgeCaseGrid`.
* [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html): removed `Sort: Type ⚡` from `#badges-sort-by`; bumped cache tags to `style.css?v=10.92` and `app.js?v=10.80` (+ importmap entries `?v=10.80`).
* [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): `CACHE_NAME` → `poke-chart-cache-v206`.
* [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): updated TC91 step (D); added TC107 and TC108.
* [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md) & [`docs/prd_badge_collection.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_badge_collection.md): updated Badge Case sort option docs.

---

## 6. Validation Instructions

1. **Cache**: hard-refresh `https://crsjain.github.io/kepler-pokemon-chart/` and confirm `poke-chart-cache-v206` (`style.css?v=10.92`, modules `?v=10.80`).
2. **Mobile multi-month week header**: on a phone viewport (e.g., 390px–412px wide), view a week spanning two months (`Sep 27 - Oct 3, 2026`) and verify both wrapped lines (`Sep 27 - Oct 3,` and `2026`) are horizontally centered between `◀ Prev` and `Next ▶`.
3. **Badge Case sort & mobile layout**: open **🏆 Case** on the Trainer Card. Verify `#badges-sort-by` offers `Sort: Date Earned 📅`, `Sort: No. 🔢`, and `Sort: A-Z 🔤` (no `Sort: Type ⚡`), both dropdowns share the warm tan border, and on narrow mobile screens the stacked dropdowns do not overlap the badge cards.
4. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass (96 blocks, 95 unique numbers, including TC107 and TC108).
