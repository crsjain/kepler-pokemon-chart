# CHECKPOINT 85

This document contains a complete, chronological record of user requests, system
configurations, version progress, and active schema definitions for the
application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **style.css cleanup, "light path"** (plan: [`docs/plan_style_css_cleanup.md`](plan_style_css_cleanup.md)).
  - **Owner's goal:** make the file "easier to work in, NOT to change how anything looks".
  - **Decisions D1–D4** (2026-11-01), after a Senior Staff Engineer review:
    - D1: the light path, not the full rebuild.
    - D2: commit the screenshot scripts but not the screenshots.
    - D3: improve the screenshot check before any CSS change.
    - D4: no visual change, both themes, both chart styles, past weeks.
  - **Phases:**
    - P0: plan and rig (`ba2ca9f`).
    - P1: 48 dead rules, 4 unused tokens and 19 shadowed duplicates deleted (`df3d86e`).
    - P2: 132 base declarations deleted that the always-on `body[data-theme]` skin restates (`23424b1`).
    - P3: 26 `/* @section <name> */` markers, a top-of-file index and an AGENTS.md §2 map (`4919474`).
  - **Result:** 11,380 → 10,864 lines (P3 added 57 comment lines). `!important` 306 → 295.
  - **Verification:** every phase passed a 723-screen before/after compare against the `042d169` baseline (0 changes) and the full suite.
- [x] **CSS visual regression rig** (`tools/css_rig/`, scripts only).
  - 723 screens: 5 viewports including 2× tablet density, both themes, both chart styles, past week, 15 modals, 5 Admin tabs, Exception Mode, Fix last week dock, superseded columns, boot skeleton, and forced hover/active/focus.
  - Each screen also saves a computed-style fingerprint, including `cursor`, `pointer-events` and `touch-action`.
  - A Safari-safety lint: vendor prefixes kept, `@keyframes` unchanged, no mixed vendor-pseudo selector lists.
  - **"Tests are slow" (owner):** the suite was always ~35 s; the slow part was the screenshot rig. The rig now runs in parallel (`--jobs=3`, ~5 min, was ~13) and has a `--quick` mode (~1 min) (`e5bb30b`).
- [ ] **Owner tablet check after this deploy** (plan §8, ~5 min, on iPad Safari):
  - Both kids, both chart styles.
  - Last week.
  - Set Exceptions taps cycle 🔴 → ✨ → 💤.
  - Vault and Shop blurred backdrops look normal.
- [ ] **Carried:** owner VQA of Checkpoint 84 items; prod acceptance of Kepler's Thursday star via Fix last week.

### Known Follow-ups / Nice-to-haves

- [ ] **Deferred cleanup** (plan §5): pick each one up only when a feature already touches that area.
  - Folding the skin into the base rules (~−1,000 lines).
  - Unwinding the ~170 cell-skin `!important`s. They control tapping (`pointer-events`), so first add `elementFromPoint` asserts to `tests.js`.
  - Regrouping and merging `@media` blocks.
  - An `admin.css` split.
- [ ] Concurrent session commit `1f3e360` (docs only): the PRD `docs/prd_week_over_start_new_week.md` (approved, not implemented; reserves **TC131**). It ships with this deploy as docs.
- [ ] Carried from CP84:
  - Stale build on one tablet: confirm both pick up `v275`.
  - Phone Big Buttons Vault is 50.5px, under 52px.
  - `#vault-debug-panel` still uses the old debug button style.
  - Goal column is tight at ~1024px.
  - Unicorn Phase 1 gaps; Phase 2 companions.
  - Star shower ignores reduced motion.
  - §7 Phase 3 (V20, TC116).
  - Mega slot "?" edge case.
  - Kid-side inline styles (Rule 8).
  - `viewport-fit=cover`.
- [x] Resolved: `--sk-warn-*` tokens deleted (P1).

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v275`**. Asset tags: `style.css?v=11.38`, `app.js?v=11.35` (+ all 14 importmap entries `?v=11.35`, unchanged: no JS changed), `particles.js?v=10.8`. The app label is still `v1.8.0 (v58)`.
*   **Admin Password**: family Parent PIN at `users/{uid}.adminPassword` (legacy fallback `"zxcv"`).
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`).
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Test Suite**: **117 blocks, 116 unique numbers** (`dupes:12`; gaps 40, 43, 44; max **130**; TC116 and TC131 reserved; next free **132**). `node run_headless_tests.js` takes ~35 s; `node run_headless_tests.js <N>` takes ~6 s.
*   **CSS rig**: see `tools/css_rig/README.md`.
    - `node tools/css_rig/capture.js <tag> [--quick]`, then `node tools/css_rig/compare.js <A> <B>`.
    - Output goes to `~/.cache/kpc-css-rig/`. The baseline is `~/.cache/kpc-css-rig/baseline` at `042d169`.
    - Needs the :8000 server. CDP ports 9271–9273.
    - Never edit CSS while a capture runs.

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 82 §3](checkpoint_82.md). **No schema bump or migration this session.**

---

## 4. Work Accomplished

### style.css cleanup (no visual change)
* **`style.css`**:
  - P1 deleted unreferenced rules (`.transition-option-*`, `.sound-control`/`.volume-slider`, `.filter-toggle-label`, `.admin-coming-soon*`, `.confirm-tip-box`, `.badge-label`, `.adm-list-row*`, …), `--shadow`, `--sk-warn-*`, and earlier duplicate declarations.
  - P2 deleted base values that a `body[data-theme] <same selector>` skin rule restates. The skin banner now says it wins for both themes.
  - P3 added the section index and `@section` markers.
* **`_agents/AGENTS.md`**:
  - §2 `style.css` row and section map.
  - §5 rig pointer.
  - Reference table entry for the plan.
* **`docs/plan_style_css_cleanup.md`**: the plan, owner decisions, per-phase results, deferred items, and the pre-deploy tablet check.

### Tooling
* **`tools/css_rig/capture.js`, `compare.js`, `README.md`**: the visual regression rig (see §2).
  - **Noise rule:** a difference counts as noise only if computed styles are identical AND it is ≤16 px or a ≤2/255 colour shift. This is backdrop-blur jitter.
  - **A real bug it caught:** in P1, removing an emptied rule left half a selector list attached to the next rule. Only the computed-style diff showed it.

---

## 5. Files and Code

### Created Files
* [`docs/plan_style_css_cleanup.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/plan_style_css_cleanup.md): cleanup plan and record.
* [`tools/css_rig/capture.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tools/css_rig/capture.js), [`compare.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tools/css_rig/compare.js), [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tools/css_rig/README.md): visual regression rig (not shipped, not in `ASSETS_TO_CACHE`).
* [`docs/checkpoint_85.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_85.md): this file.

### Edited Files
* [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css): P1–P3 (above).
* [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html): `style.css?v=11.38`.
* [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): `poke-chart-cache-v275`.
* [`_agents/AGENTS.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/AGENTS.md): style.css navigation map, rig pointer, plan reference.

---

## 6. Validation Instructions

1. **Tablet check** (plan §8), on iPad Safari after the deploy:
   - Both kids, Standard and Big Buttons.
   - Prev (last week).
   - Admin → Set Exceptions: tap cells, check they cycle 🔴 → ✨ → 💤.
   - Open the Vault and the Partner Shop: blurred backdrops should look normal.
   - If anything looks stale, use Admin › Data › Reload latest version.
2. **Visual compare**: `node tools/css_rig/capture.js now && node tools/css_rig/compare.js baseline now` should report 0 changed.
3. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass.
