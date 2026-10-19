# CHECKPOINT 77

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Deploy §7 Phase 2: stop per-child PIN writes** (`96fbe79`): crsjain: *"Deploy Phase 2"* (2026-10-19). Both preconditions in `prd_parent_pin_and_family_signin.md` §7 were met:
  - The doc-level `users/{uid}.adminPassword` was verified on prod (owner's Firebase console screenshot, 2026-10-15) and on staging (emulator read).
  - There were at least 1 day of owner use in prod (R5).

  `phase2/stop-per-child-pin-writes` was fast-forward merged into the dev branch and deployed. §7 is ticked.

### Known Follow-ups / Nice-to-haves

- [ ] **Next unshipped phase: §7 Phase 3, remove `adminPassword` from per-child state (V20).** Earliest start **2026-10-26** (owner decision R6, 2026-10-19: the full 7 days after Phase 2; no owner testing required). Before starting, re-verify the doc field in the Firebase console. Scope, the TC116 "no passcode lost" fixtures, and rollback are in §7.3–7.4.
- [ ] **Real-Firebase check, remaining half** (carried): changing the family password signs out the kids' tablets. Steps are in PRD §6.
- [ ] **Optional "This is a parent device" toggle** (carried): parked (PRD §6).
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
*   **Active Branch**: `prototype/pokemon-badge-collection`. `phase2/stop-per-child-pin-writes` is merged and can be deleted.
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v214`**. Asset tags: `style.css?v=10.98`, `app.js?v=10.86` (+ all 14 `<script type="importmap">` entries `?v=10.86`), `particles.js?v=10.4`.
*   **Admin Password**: the family-wide **Parent PIN** at `users/{uid}.adminPassword`, which is the only place it is written. The legacy fallback is `"zxcv"`. **Forgot PIN?** recovers it with the family sign-in password.
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`). Emulator login `crsjain+staging@gmail.com` / `food3333`.
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Audio/Volume Settings**: Unchanged.
*   **Test Suite**: **103 blocks, 102 unique numbers** (`dupes:12` expected; gaps `40, 43, 44`; max **115**; next free **116**, which is reserved for §7 Phase 3). Run via `node run_headless_tests.js` (~34–38 s).

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 64 §3](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_64.md). **No migration.**

Per-child `state.adminPassword` is still part of the shape (module default, template and `WIPE_PRESERVED_KEYS`), but nothing writes it any more:
- New children and per-child restores carry no copy.
- Existing copies are read only as a fallback.

Phase 3 removes the field with V20.

---

## 4. Work Accomplished

### §7 Phase 2: stop per-child PIN writes (`96fbe79`)
* **`firebase.js`**: the new pure `buildFamilyPasscodeUpdate(pin)` returns `{ adminPassword, updatedAt }`. `saveAdminPasswordToCloud(newPassword)` writes only that; the `profiles.*.state.adminPassword` fan-out and the `profilesList` parameter are gone.
* **`admin.js`**: the change-PIN handler sets only the family PIN, with no `state.adminPassword` and no `saveState`. Per-child "Restore from code" drops the backup's `adminPassword` instead of re-stamping it. The header comment is updated.
* **`app.js`**: add-child deletes `adminPassword` from the new child's state. A `saveAdminPasswordFn` seam was added, with helpers `setSaveAdminPasswordMock` and `buildFamilyPasscodeUpdate`.
* **`tests.js`**:
  * **TC50**: the family PIN changes, and the child copy is not written.
  * **TC100**: assertions use `getParentPasscode()`. The cloud save receives only the PIN, and the Firestore update keys are exactly `adminPassword` and `updatedAt`.
  * **TC110**: new and restored children carry no copy, and the family PIN still applies.
* **`docs/prd_parent_pin_and_family_signin.md`**:
  * §3.1 now says the save writes only the doc-level field.
  * §7 records R5 (soak shortened to ≥ 1 day), the gate verification, and the Phase 2 tick.
* **`service-worker.js`**: `CACHE_NAME` → `poke-chart-cache-v214`.

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_77.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_77.md): this checkpoint.

### Edited Files
* [`firebase.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/firebase.js): doc-level-only PIN save.
* [`admin.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/admin.js): no child-copy writes on change or restore.
* [`app.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js): add-child carries no copy; save seam.
* [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): TC50, TC100, TC110.
* [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html), [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): cache v214 / `?v=10.86`.
* [`docs/prd_parent_pin_and_family_signin.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_parent_pin_and_family_signin.md): §3.1, §7.

---

## 6. Validation Instructions

1. **Cache**: hard-refresh `https://crsjain.github.io/kepler-pokemon-chart/` and confirm `poke-chart-cache-v214`.
2. **PIN change writes only the family field**: change the PIN in Admin › 👥 Family. In the Firebase console, the top-level `adminPassword` updates. The children's `profiles.<id>.state.adminPassword` values do **not** change (they keep their old value until Phase 3 removes them).
3. **The PIN works everywhere**: the new PIN opens Admin on every tablet, whichever child is active.
4. **Automated Suite**: run `node run_headless_tests.js` and verify 100% pass (103 blocks).
