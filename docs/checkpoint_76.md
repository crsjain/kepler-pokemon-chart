# CHECKPOINT 76

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Evaluate and plan retiring the per-child PIN copies**: crsjain asked for an evaluation and plan first (*"Don't change any code until I approve a direction"*): a map of every `adminPassword` read and write, two options, a phased plan, and a feature-review-panel pass. The panel verdict was APPROVED WITH MITIGATIONS. The plan was approved through the owner's artifact review policy with its defaults (Option B: backfill → stop per-child writes → V20 removal; Forgot PIN in Phase 1; soak gates). It is recorded as **`prd_parent_pin_and_family_signin.md` §7** (`b23cdb9`), which holds the phase table, preconditions, status checkboxes and rollback notes. Full analysis: `~/.gemini/jetski/brain/2e1b53ab-c301-4a12-8169-74c4c10a31dc/retire_per_child_pin_plan.md`.
- [x] **§7 Phase 1: backfill + safety net** (`54217c5`, `5033759`):
  - The doc-level PIN is backfilled once from per-child copies (transactional write-if-absent).
  - Restoring an old family code keeps the family PIN.
  - New **Forgot PIN?** link: the family sign-in password opens Admin › Family to set a new PIN.
- [x] **Forgot PIN when signed out** (`5033759`): crsjain: *"Add the Forgot PIN link when the device isn't signed in."* The link is always shown. When signed out, it explains and offers **Sign in**, which opens Family sign-in.
- [ ] **Verify the doc field after deploy** (crsjain asked for this right after this wrap-up): `users/{uid}.adminPassword` exists on prod and staging. This is the Phase 2 gate.
- [ ] **§7 Phase 2: stop per-child writes**: crsjain: *"let's start Phase 2 development which should take at least a day before I deploy to prod. In the meantime I'll be using the PIN changes in prod."* Development is on the separate branch `phase2/stop-per-child-pin-writes`, so a wrap-up of other work can't ship it early. It deploys only when the owner says so: **no earlier than 2026-10-16**, and only after the doc field is verified.

### Known Follow-ups / Nice-to-haves

- [ ] **Next unshipped phase: §7 Phase 2, stop per-child PIN writes.** Earliest deploy **2026-10-16** (owner shortened the 7-day soak to "at least a day" on 2026-10-15). Precondition: the doc field is verified on prod and staging. It's developed on `phase2/stop-per-child-pin-writes`; merge into the dev branch only when deploying. **Phase 3** (V20 removal) keeps its gate: Phase 2 live ≥ 7 days.
- [ ] **Real-Firebase check, remaining half** (carried): changing the family password signs out the kids' tablets. Steps are in PRD §6.
- [ ] **Optional "This is a parent device" toggle** (carried): parked. Build it only if PIN entry on the parent phone becomes real friction (PRD §6).
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
*   **Active Branch**: `prototype/pokemon-badge-collection`. Phase 2 work goes on `phase2/stop-per-child-pin-writes`.
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v213`**. Asset tags: `style.css?v=10.98`, `app.js?v=10.85` (+ all 14 `<script type="importmap">` entries `?v=10.85`), `particles.js?v=10.4`.
*   **Admin Password**: the family-wide **Parent PIN** (4–6 digits) at `users/{uid}.adminPassword`. The legacy text passcode (default `"zxcv"`) is the fallback until a PIN is set. **Forgot PIN?** recovers it with the family sign-in password.
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`). Emulator login `crsjain+staging@gmail.com` / `food3333`.
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Audio/Volume Settings**: Unchanged.
*   **Test Suite**: **103 blocks, 102 unique numbers** (`dupes:12` expected; gaps `40, 43, 44`; max **115**, next free **116**). Run via `node run_headless_tests.js` (~35 s; one run took 51 s).

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 64 §3](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_64.md). **No new persisted field and no migration.** The backfill writes only the existing doc-level `users/{uid}.adminPassword`. Per-child `state.adminPassword` is still present and still written (removal is §7 Phases 2–3).

---

## 4. Work Accomplished

### Retiring per-child PIN copies: plan (`b23cdb9`)
* **`docs/prd_parent_pin_and_family_signin.md`**:
  * New §7: decisions R1–R4, key findings, the phase table (scope, files, tests, preconditions with earliest dates, status), a change log, and rollback.
  * §6 points to §7, records the parked parent-device toggle, and lists the manual sign-out check steps.
* **`_agents/AGENTS.md`**: the PRD's reference-table row mentions §7.

### Phase 1: backfill + Forgot PIN (`54217c5`, `5033759`)
* **`admin.js`**:
  * `resolveLegacyFamilyPasscode(profiles)` (pure): ignores empty / non-string / `zxcv` copies, then prefers a 4–6 digit PIN, then the most common value, then the newest `updatedAt`.
  * `normalizeFamilyBackup(parsed)`: used by family restore. A code with the doc field restores it; otherwise the PIN comes from the code's copies, or the current family PIN is kept.
  * Forgot PIN mode (`setForgotPinMode`, `handleForgotPinSubmit`):
    * Signed in: family password → `reauthenticateFamily` → Admin › Family with New PIN focused. The gated action is not run, and the PIN is unchanged.
    * Signed out: hint plus a **Sign in** hand-off to `#family-login-modal`.
  * New `describeAuthError` context `'reauth'`.
* **`app.js`**:
  * `backfillFamilyPasscode` runs from `handleProfilesUpdate` when the snapshot has no doc field. It has an in-flight guard and retries on the next snapshot.
  * New callbacks: `reauthenticateFamily`, `openFamilyLogin`.
  * New seams: `setEnsureFamilyPasscodeMock`, `setFamilyAuthMock({ reauth })`, `resolveLegacyFamilyPasscode`, `normalizeFamilyBackup`.
* **`firebase.js`**: `ensureFamilyPasscodeInCloud` (`runTransaction` write-if-absent) and `reauthenticateFamily`.
* **`index.html` / `style.css`**: `#password-forgot-btn` (44px `.login-link-btn`), and `#password-forgot-panel` with the family-password field (`inputmode="text"`) and the signed-out hint. The `.forgot-mode` / `.forgot-signed-out` swaps are CSS only, with no inline styles (Rule 8).
* **`tests.js`**:
  * **TC114**: resolver cases, write-if-absent, skipped transaction, retry after failure, family-restore normalisation (unit and end to end).
  * **TC115**: Forgot PIN signed out and signed in, empty and wrong password copy, success lands on the PIN card, reset on reopen.
* **`README.md`**: Forgot PIN and backfill.
* **`service-worker.js`**: `CACHE_NAME` → `poke-chart-cache-v213`.

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_76.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_76.md): this checkpoint.

### Edited Files
* [`admin.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/admin.js): resolver, restore normalisation, Forgot PIN.
* [`app.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js): backfill hook, callbacks, test seams.
* [`firebase.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/firebase.js): `ensureFamilyPasscodeInCloud`, `reauthenticateFamily`.
* [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html): Forgot PIN markup, `?v=` tags.
* [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css): Forgot PIN styles.
* [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): TC114, TC115.
* [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): cache v213.
* [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md): Parent PIN bullets.
* [`docs/prd_parent_pin_and_family_signin.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_parent_pin_and_family_signin.md): §5 tests, §6, new §7.
* [`_agents/AGENTS.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/AGENTS.md): reference-table row.

---

## 6. Validation Instructions

1. **Cache**: hard-refresh `https://crsjain.github.io/kepler-pokemon-chart/` and confirm `poke-chart-cache-v213`.
2. **Doc field (Phase 2 gate)**: open the app once on each signed-in device. Then check in the Firestore console that `users/{uid}.adminPassword` exists, for prod and for the staging emulator.
3. **Forgot PIN, signed in**: tap ⚙️, then tap **Forgot PIN?** under the keypad. Enter a wrong family password: you should see "That family password isn't right." Enter the right one: Admin opens on 👥 Family with New PIN focused, and the PIN is unchanged until you save a new one.
4. **Forgot PIN, signed out** (emulator or local mode): Forgot PIN? explains that the device isn't signed in, and **Sign in** opens Family sign-in.
5. **Automated Suite**: run `node run_headless_tests.js` and verify 100% pass (103 blocks).
