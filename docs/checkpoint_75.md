# CHECKPOINT 75

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **De-emphasise "+ Add child" (`ee13858`)**: crsjain: *"The location and styling of 'Add Child' shouldn't be so prominent as it is rarely used. Have the staff UX designer advise where best to put this button and what it should look like."* Ran Stage 4 (Staff UX Designer) of `feature-review-panel` only, since the other stages don't apply to a placement and styling change. Verdict PASS. Owner approved, and it was built:
  - **Placement**: moved out of the Children card header (where the primary action usually goes, beside the row actions) to a trailing row **below the last child**. Users expect "add another" there, as in Family Link and iOS Settings.
  - **Style**: a left-aligned **text link** reading "+ Add a child" in `#1d4f90` (8.2:1). It has no fill, border or pixel shadow, so it can't read as a form field (white secondaries were rejected 2026-09-29). It underlines on hover, presses with `translateY(2px)` and keeps a 44px tap target.

### Known Follow-ups / Nice-to-haves

- [ ] **Real-Firebase check, remaining half** (carried): changing the family password signs out the kids' tablets.
- [ ] **Stop fanning the PIN out to `profiles.*.state.adminPassword`** (carried) after a release soak, then drop the field from the template and `WIPE_PRESERVED_KEYS` with a migration (`prd_parent_pin_and_family_signin.md` §6).
- [ ] **Optional "This is a parent device" toggle** (carried; deferred to see how the keypad works for a week first).
- [ ] **Stale-module error on localhost** (carried).
- [ ] **Add the viewport sweep to the toolchain** (carried).
- [ ] **"Rest whole day" shortcut in Exception Mode** (carried).
- [ ] **Historical week task order after a reorder** (carried).
- [ ] **Remaining kid-side inline styles (Rule 8)** (carried): the debug sidebar, the header Guide button, and the add-profile modal fields.
- [ ] **`viewport-fit=cover` safe-area** (carried).
- [ ] **Chart Style (under 5)** (carried): needs its own PRD first.
- [ ] **Logged-in manual check** (carried): per-child reset and the Activities merge-by-id save against real Firestore.
- [ ] **Test-harness sleep savings** (carried): ~8 s.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v211`** / Asset tags `style.css?v=10.96`, `app.js?v=10.83` (+ all 14 `<script type="importmap">` entries `?v=10.83`, unchanged), `particles.js?v=10.4`
*   **Admin Password**: the family-wide **Parent PIN** (4–6 digits) at `users/{uid}.adminPassword`. The legacy text passcode (default `"zxcv"`) is the fallback until a PIN is set. The **family sign-in password** is the separate Firebase password (6+ characters).
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`). Emulator login `crsjain+staging@gmail.com` / `food3333`. Live emulator data is in `.emulator_autosave/latest` (gitignored).
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths. `.gitallowed` covers the public Firebase web keys.
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Audio/Volume Settings**: Unchanged.
*   **Test Suite**: **101 blocks, 100 unique numbers** (`dupes:12` expected; gaps `40, 43, 44` are historical; max **113**, next free **114**). Run via `node run_headless_tests.js` (~34–43 s).

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 64 §3](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_64.md). **No new persisted field and no migration.**

---

## 4. Work Accomplished

### Quiet "+ Add a child" link (`ee13858`)
* **`index.html`**: `#admin-add-child-btn` moved out of `.adm-card-title-row` (wrapper removed). It is now the sibling right after `#admin-profiles-list`, not inside it, because JS re-renders the list. Class changed from `pixel-btn adm-secondary` to `adm-link-btn`, so TC97's "every `.pixel-btn` has an `adm-*` variant" rule doesn't apply. Label is "+ Add a child". The ID is unchanged, so TC100/TC103/TC112 and Cancel focus-return still work. `style.css?v=10.96`.
* **`style.css`**: new `#admin-modal .adm-link-btn` (transparent, borderless, 44px min-height, `align-self: flex-start`, hover underline, active press). Removed the now-orphaned `.adm-card-title-row` rules.
* **`tests.js`**: **TC113** checks that the button is a text link and not a pixel button, has the right label, sits right after the list and outside it, isn't in the header, has no fill, border or shadow, is at least 44px tall, renders below the list and has no inline style.
* **`service-worker.js`**: `CACHE_NAME` → `poke-chart-cache-v211`.
* **`README.md`**: the Family bullet describes the quiet link under the list.

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_75.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_75.md): this checkpoint.

### Edited Files
* [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html): Family card markup, style tag.
* [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css): `.adm-link-btn`; dead `.adm-card-title-row` removed.
* [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): TC113.
* [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): cache v211.
* [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md): Family bullet.

---

## 6. Validation Instructions

1. **Cache**: hard-refresh `https://crsjain.github.io/kepler-pokemon-chart/` and confirm `poke-chart-cache-v211` (`style.css?v=10.96`).
2. **Placement**: Admin › 👥 Family. The Children card header shows only "Children". A blue "+ Add a child" text link sits left-aligned under the last child row, with no box or shadow. It underlines on hover.
3. **Behaviour**: tap it. The add-child form opens over Admin with no second PIN prompt. Cancel closes it and returns focus to the link.
4. **Automated Suite**: run `node run_headless_tests.js` and verify 100% pass (101 blocks, 100 unique numbers).
