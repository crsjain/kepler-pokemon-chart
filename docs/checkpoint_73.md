# CHECKPOINT 73

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Passcode / credential evaluation (no code)**: crsjain: *"evaluate the app's passcode/credential system and recommend how to revamp it so it's easier to use."* I mapped every gate and found five ways the per-child passcode copies drift apart (D1 new children seeded with `zxcv`, D2 the picker's "+ Add Child" checking the module default, D3 per-child restore, D4 family restore, D5 stale whole-state writes). I also found that the top-level `users/{uid}.adminPassword` was written but never read, that "Sign Out Family" was ungated, and that the family password couldn't be changed or reset in the app. I recommended Option A (one family PIN plus a manageable family sign-in) and ran it through the feature-review-panel (APPROVED WITH MITIGATIONS).
- [x] **Parent PIN + Family sign-in revamp (`dde5b37`)**. Owner decisions: *"Switch to 4-6 digit PIN with number keypad"*, *"Allow reset email and in-app change password"*, *"Sign out family should ask for PIN"*. Owner confirmed access to the prod and staging family inboxes. Shipped:
  - One family-wide PIN, with the doc-level field as the source of truth.
  - An on-screen keypad that auto-submits.
  - The PIN gates Sign Out Family.
  - Fixes for drift paths D1, D2, D3 and D5.
  - "Forgot password?" on the login screen.
  - A "Family sign-in ✉️" Admin card with *Send reset email* and *Change password*.
  - TC110–TC112.
- [x] **Wrong-PIN line harder to miss**: crsjain: *"Make this text in a different color… so that it is harder to miss."* On the UX designer's advice: burnt orange `#c2410c` on an amber tint `#fff7ed` with a `#ea580c` border. That's 4.88:1 (AA), uses the warning tone (Rule 11), and is still never red (Q8). TC97 asserts it.
- [x] **Emulator persistence without remembering a clean shutdown (`c696b79`)**: crsjain: *"setup the system in a way that I don't need to remember to shut down the emulator cleanly"* and *"I want ease of use… as little interference and addition of tech debt as possible."*
  - `run_emulator.sh` autosaves every 10 minutes to the gitignored `.emulator_autosave/` and keeps 10 snapshots.
  - SIGINT/TERM/HUP become a clean shutdown with a final save.
  - On start it imports the newest snapshot. The committed seed `emulator_data/` is never written automatically.
  - Owner declined the systemd service and binding the UI to `0.0.0.0`.
  - **Closes the carried "Emulator persistence" follow-up.**
- [x] **git-secrets allowlist**: crsjain: *"Add a .gitallowed file listing those two keys."* The repo-root `.gitallowed` lists the two public Firebase web API keys, so commits that touch `firebase.js` pass the pre-commit hook.

### Known Follow-ups / Nice-to-haves

- [ ] **Stop fanning the PIN out to `profiles.*.state.adminPassword`** after this release has been on every device for a while. Then drop `adminPassword` from the state template and `WIPE_PRESERVED_KEYS` with a migration. It's kept for one release so older cached clients still agree (`prd_parent_pin_and_family_signin.md` §6).
- [ ] **Real-Firebase manual check** (not testable in the headless suite): a reset email arrives in the prod and staging inboxes, and changing the family password signs out the kids' tablets.
- [ ] **Optional "This is a parent device" toggle** to skip the PIN on the parent phone. Deferred: try the auto-submit keypad for a week first.
- [ ] **Stale-module error on localhost** (carried): `'./pokemon_data.js' does not provide an export named 'STARTER_PIKACHU_INSTANCE_ID'` after an emulator restart. Hard refresh or clear site data.
- [ ] **Add the viewport sweep to the toolchain** (carried).
- [ ] **"Rest whole day" shortcut in Exception Mode** (carried).
- [ ] **Historical week task order after a reorder** (carried).
- [ ] **Remaining kid-side inline styles (Rule 8)** (carried): the debug sidebar, the header Guide button, and the add-profile modal fields. The login modal is now clean.
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
*   **Current Version**: Service Worker cache **`poke-chart-cache-v209`** / Asset tags `style.css?v=10.95`, `app.js?v=10.82` (+ all 14 `<script type="importmap">` entries `?v=10.82`), `particles.js?v=10.4`
*   **Admin Password**: now the family-wide **Parent PIN**, stored at `users/{uid}.adminPassword`. Families that haven't set a 4–6 digit PIN keep the legacy text passcode (default `"zxcv"`) until they do. Test mode stays legacy (`zxcv`).
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`). Emulator family login: `crsjain+staging@gmail.com` / `food3333`. Live emulator data is in `.emulator_autosave/latest` (gitignored); the seed is `emulator_data/`. Reset links: `curl http://127.0.0.1:9099/emulator/v1/projects/demo-pokemon-chart/oobCodes`.
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths. `.gitallowed` covers the public Firebase web keys; never use `--no-verify`.
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Audio/Volume Settings**: Unchanged.
*   **Test Suite**: **100 blocks, 99 unique numbers** (`dupes:12` expected; gaps `40, 43, 44` are historical; max **112**, next free **113**). Run via `node run_headless_tests.js` (**~34–45 s**; 33.9 s at wrap-up).

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 64 §3](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_64.md). **No new persisted field and no migration.** The Parent PIN's source of truth is the *doc-level* `users/{uid}.adminPassword` (outside `state`). `state.adminPassword` remains as a legacy fallback and is still fanned out for one release.

---

## 4. Work Accomplished

### Parent PIN (`dde5b37`)
* **`admin.js`**:
  * `setFamilyPasscode` / `getParentPasscode` / `isPinPasscode`, with precedence family field → active child's `state.adminPassword` → `ADMIN_PASSWORD`.
  * `applyPasswordPromptMode` toggles `.pin-mode`. In PIN mode the input gets `inputmode="none"` and `maxlength=6`, and the keypad is shown; otherwise the legacy hint is shown.
  * `pressPinKey`, digit stripping, and `maybeAutoSubmitPin` (submits at the stored PIN's length).
  * `handlePasswordSubmit` checks `getParentPasscode()`.
  * PIN change validates `^\d{4,6}$`, sets the family PIN optimistically, and still fans out. Toast: "PIN Updated 🔑".
  * Per-child restore keeps the family PIN.
  * `refreshPinStatus` nudge.
* **`firebase.js`**: `subscribeToProfiles` passes `familyMeta.adminPassword`.
* **`app.js`**:
  * `handleProfilesUpdate(profiles, familyMeta)` pushes the PIN.
  * Sign-out clears it in memory.
  * New children inherit `getParentPasscode()`.
  * **Sign Out Family** is wrapped in `promptParentPassword` (`confirmSignOutFamily`).
  * Prompt copy updated.
* **`index.html` / `style.css`**:
  * `#password-keypad` (1–9, Clear, 0, ⌫; 56px tonal-blue keys with a `translateY(2px)` press).
  * `#password-legacy-hint`.
  * "Parent PIN 🔑" title and Family card with numeric fields and `#admin-pin-status`.
  * Family tab title "Children, Parent PIN & sign-in" with sub-label "Children · PIN".
  * Orange warning style for the wrong-code line.

### Family sign-in (`dde5b37`)
* **`firebase.js`**: `sendFamilyPasswordReset`, `getFamilyEmail`, and `changeFamilyPassword` (reauthenticate, then `updatePassword`).
* **`admin.js`**:
  * `describeAuthError` maps codes to calm copy.
  * The `#admin-signin-card` logic: email display, *Send reset email* with a 30 s cooldown, *Change password* form with validation, warning that other devices are signed out, and a success toast.
* **`app.js` / `index.html` / `style.css`**:
  * Login modal inline styles moved to CSS.
  * Once-per-device subtitle.
  * **Forgot password?** link, throttled, with an emulator note.
  * Enter key submits.
  * Mapped errors.
  * Mockable auth functions.

### Emulator persistence (`c696b79`)
* **`run_emulator.sh`**: autosave loop, atomic snapshot promotion, pruning, signal forwarding, a 60 s export grace period, and pending-exit recovery. It resolves the `latest` symlink because the CLI's `lstat()` check otherwise starts the emulator **empty**.
* **`.gitignore`**: `.emulator_autosave/`. **`start.sh`** (sidecar): `exec ./run_emulator.sh`.

### Docs
* New **`docs/prd_parent_pin_and_family_signin.md`** (canonical spec).
* Pointers added to `prd_parent_past_day_approval.md` and `prd_admin_panel_redesign.md` §11.9.
* `README.md` updated.
* `_agents/AGENTS.md`: reference table and the §4 emulator persistence notes.

### Tests
* **TC110**:
  * Family PIN precedence and snapshot meta.
  * The picker's "+ Add Child" rejects `zxcv`.
  * Sign Out gate: Cancel and a wrong PIN never reach the confirm.
  * A new child inherits the PIN.
  * A per-child restore keeps the PIN.
* **TC111**:
  * Keypad layout, size and Rule 8.
  * Append, ⌫ and Clear.
  * Auto-submit on wrong and right entries.
  * Physical-keyboard digit stripping.
  * Legacy mode.
  * Family-card nudge.
* **TC112**:
  * Login modal Rule 8, copy and 44px link.
  * Forgot password: empty email, success, throttle, mapped error.
  * Admin sign-in card when signed out and signed in.
  * Reset email with cooldown.
  * Change-password validation, wrong current password, success.
* **Updated**: TC50 and TC100 (numeric PINs, new copy, `setFamilyPasscode(null)` cleanup); TC97 (title and orange warning colour); TC98 (export hint copy).

---

## 5. Files and Code

### Created Files
* [`docs/prd_parent_pin_and_family_signin.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_parent_pin_and_family_signin.md): Parent PIN & Family sign-in spec.
* [`.gitallowed`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/.gitallowed): git-secrets allowlist for the two public Firebase web keys.
* [`docs/checkpoint_73.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_73.md): this checkpoint.

### Edited Files
* [`admin.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/admin.js), [`app.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js), [`firebase.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/firebase.js): Parent PIN, keypad, Sign Out gate, family sign-in.
* [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html), [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css): keypad, Family cards, login modal (Rule 8), orange warning; cache tags `style.css?v=10.95`, modules `?v=10.82`.
* [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): `CACHE_NAME` → `poke-chart-cache-v209`.
* [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): TC110–TC112 added; TC50, TC97, TC98 and TC100 updated.
* [`run_emulator.sh`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/run_emulator.sh), [`.gitignore`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/.gitignore), [`.agents/sidecars/firebase_emulator/start.sh`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/.agents/sidecars/firebase_emulator/start.sh): emulator autosave.
* [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md), [`_agents/AGENTS.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/AGENTS.md), [`docs/prd_parent_past_day_approval.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_parent_past_day_approval.md), [`docs/prd_admin_panel_redesign.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_admin_panel_redesign.md): docs.

---

## 6. Validation Instructions

1. **Cache**: hard-refresh `https://crsjain.github.io/kepler-pokemon-chart/` and confirm `poke-chart-cache-v209` (`style.css?v=10.95`, modules `?v=10.82`).
2. **Legacy passcode still works**: on prod, ⚙️ shows the text field and the "Set a 4–6 digit PIN…" hint. Your existing passcode opens Admin.
3. **Set the family PIN**: Admin › 👥 Family › Parent PIN 🔑 → enter 4–6 digits twice → *Update PIN*. On a kid tablet, ⚙️ now shows the keypad and unlocks at the last digit. A wrong PIN shows the orange "That's not the code — try again." box.
4. **Gates**: past-day approval (Lyra), the picker's "+ Add Child", and Switch Trainer → Sign Out Family all ask for the PIN. Cancel never signs out.
5. **Family sign-in**: Admin › Family › Family sign-in ✉️ shows the family email. *Send reset email* → the email arrives in the prod inbox. Optionally *Change password*: other devices are signed out and need the new password.
6. **Login screen**: no inline styles. *Forgot password?* sends a reset link to the typed email.
7. **Emulator (local)**: `./run_emulator.sh` logs `Importing from .emulator_autosave/snap-…`, and a new `snap-*` appears every 10 minutes. A stop logs `Saved snap-…`. `git status` stays clean.
8. **Automated Suite**: run `node run_headless_tests.js` and verify 100% pass (100 blocks, 99 unique numbers, including TC110–TC112).
