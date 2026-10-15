# CHECKPOINT 74

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Prod reset email verified**: crsjain received the Firebase reset email for the prod family account (`crsjain@gmail.com`). That covers half of Checkpoint 73's real-Firebase check.
- [x] **Email branding "Pokemon Activity Tracker" (no code)**: crsjain: *"Instead of 'pokemon-chart-3154f', can you change the text to say 'Pokemon Activity Tracker'."* The name comes from a Firebase console setting, not the app: **Project settings › General › Public-facing name**, plus optionally **Authentication › Templates › Password reset › Sender name**. The sender address and link domain keep the project ID unless a custom domain is set up. Repeat for `kepler-pokemon-chart-staging` if wanted.
- [x] **Distinguish the sign-in password from the Parent PIN (`44e2d4b`)**: crsjain: *"I thought the password can be 4-6 digits long."* On Firebase's reset page, the family sign-in password needs **6+ characters**. That minimum is Firebase's and can't be lowered. The 4–6 digit rule applies only to the in-app Parent PIN. Copy updated:
  - "Forgot password?" success line: "…This resets the family sign-in password (6+ characters), not the Parent PIN."
  - Login password placeholder: "Family password (6+ characters)".
  - Admin › Family › Family sign-in ✉️ hint: "…at least 6 characters. It is not the Parent PIN."
  - Admin reset-email status: "…needs 6+ characters (the 4–6 digit Parent PIN is separate)."

### Known Follow-ups / Nice-to-haves

- [ ] **Real-Firebase check, remaining half**: changing the family password signs out the kids' tablets. The reset email is now verified.
- [ ] **Stop fanning the PIN out to `profiles.*.state.adminPassword`** after this release has been on every device for a while. Then drop `adminPassword` from the template and `WIPE_PRESERVED_KEYS` with a migration (`prd_parent_pin_and_family_signin.md` §6).
- [ ] **Optional "This is a parent device" toggle** (deferred: try the keypad for a week first).
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
*   **Current Version**: Service Worker cache **`poke-chart-cache-v210`** / Asset tags `style.css?v=10.95`, `app.js?v=10.83` (+ all 14 `<script type="importmap">` entries `?v=10.83`), `particles.js?v=10.4`
*   **Admin Password**: the family-wide **Parent PIN** (4–6 digits) at `users/{uid}.adminPassword`, with the legacy text passcode (default `"zxcv"`) as fallback until a PIN is set. The **family sign-in password** is the separate Firebase password (6+ characters).
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`). Emulator login `crsjain+staging@gmail.com` / `food3333`. Live emulator data is in `.emulator_autosave/latest` (gitignored).
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths. `.gitallowed` covers the public Firebase web keys.
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Audio/Volume Settings**: Unchanged.
*   **Test Suite**: **100 blocks, 99 unique numbers** (`dupes:12` expected; gaps `40, 43, 44` are historical; max **112**, next free **113**). Run via `node run_headless_tests.js` (~34–45 s).

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 64 §3](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_64.md). **No new persisted field and no migration.**

---

## 4. Work Accomplished

### Sign-in password vs Parent PIN copy (`44e2d4b`)
* **`app.js`**: the "Forgot password?" success line names the family sign-in password and its 6-character minimum.
* **`admin.js`**: the "Send reset email" status line notes the 6+ character rule and that the PIN is separate.
* **`index.html`**: the login password placeholder and the Family sign-in card hint. Cache tags bumped to modules `?v=10.83`.
* **`service-worker.js`**: `CACHE_NAME` → `poke-chart-cache-v210`.

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_74.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_74.md): this checkpoint.

### Edited Files
* [`app.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js), [`admin.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/admin.js), [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html): copy.
* [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): cache v210.

---

## 6. Validation Instructions

1. **Cache**: hard-refresh `https://crsjain.github.io/kepler-pokemon-chart/` and confirm `poke-chart-cache-v210` (modules `?v=10.83`).
2. **Login copy**: sign out (Parent PIN required). The password field reads "Family password (6+ characters)". Tap *Forgot password?* with your email: the blue line ends "…not the Parent PIN."
3. **Admin copy**: Admin › 👥 Family › Family sign-in ✉️ says "at least 6 characters. It is not the Parent PIN." *Send reset email* shows the 6+ character note.
4. **Automated Suite**: run `node run_headless_tests.js` and verify 100% pass (100 blocks, 99 unique numbers).
