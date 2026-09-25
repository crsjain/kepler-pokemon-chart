# CHECKPOINT 62

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **"Wipe All Progress should only delete the active child."** Clarified with crsjain: **reset progress, keep identity and parent config.**
  - **Resets to defaults:** partners, XP, levels, badges, Star Vault, grid, exceptions, weekly history, reward picks and history.
  - **Kept:** `childName`, tasks, reward options, week start, timezone, screensaver, edit window, approve-past-days, passcode, volume, debug flag.
  - Other children are never touched. Previously it deleted **every** profile (`importFamilyData({ profiles: {} })`) and called `localStorage.clear()`.
- [x] **"A config placeholder to toggle the task chart presentation for a child under 5 / over 5 … grey it out."** Added a greyed-out, inert **🧸 Chart Style** control (`Big Buttons (under 5)` / `Standard (5+)`, with Standard shown selected) and a **Coming soon** tag, in Admin → Activity Settings. It isn't wired to state and has no listener.
- [x] Both folded into the Admin Redesign PRD as **D7** and **D8** (v1.0.0 → v1.1.0).
- [ ] **Admin Redesign implementation** is still awaiting approval of the PRD (unchanged from Checkpoint 61).

### Known Follow-ups / Nice-to-haves

- [ ] **Chart Style (under 5) feature itself** needs its own PRD and `feature-review-panel` run before building. Open design questions: per-child `chartStyle` field (a V19 migration), which surfaces scale up (Pokéballs, daily total row, Rule 13C mobile min-width), and whether it's auto-suggested when a child has ≤2 active tasks.
- [ ] **Wipe button label** still reads "Wipe All Progress (Reset)". The scope hint underneath and the confirm copy now say it's per-child. Consider renaming the label in the redesign. TC27/TC89 pin only the confirm *title*, not the button text.
- [ ] **Hold-to-unlock for Wipe** (Rule 6), carried from PRD §9.
- [ ] Carried: **Admin Redesign** PRD §8 phases, pending approval.
- [ ] Carried: **Logged-in manual check** (Checkpoint 59), plus a manual check of the per-child Wipe against real Firestore (see §6). Headless tests skip the cloud write.
- [ ] Carried: ~8 s zero-risk harness savings (assessment §6.1).

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: `v1.10.23` / Service Worker cache **`poke-chart-cache-v165`** / Asset tags **`style.css?v=10.57`**, **`app.js?v=10.50`**, `particles.js?v=10.3`
*   **Admin Password**: `"zxcv"`
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`)
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths, never `git add -A`.
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Audio/Volume Settings**: Unchanged (volume now survives a Wipe).
*   **Test Suite**: **77 blocks, 76 unique numbers** (`dupes:12` expected, max **89**). 25.8 s.

---

## 3. Active V18 State Schema

Unchanged from [Checkpoint 58 §3](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_58.md).

> [!NOTE]
> Schema stays **V18**, and no migration was needed. The Chart Style placeholder deliberately stores nothing. `buildWipedChildState` produces a fully migrated V18 object: it runs `runMigrations` on the V16 default template before overlaying the preserved keys.

---

## 4. Work Accomplished

### Per-child Wipe

* **`state.js`**: new exported `WIPE_PRESERVED_KEYS` and a pure `buildWipedChildState(current)`, which migrates the default template, deep-copies the preserved keys, and re-anchors `weekStartDate` / `activeDay` to the preserved start day and timezone. Pending schedule transitions (`pendingWeekStartDay`) are dropped.
* **`app.js`**: `wipeCloudDataFn` now defaults to `wipeActiveChildProgress()`, which runs `replaceState(buildWipedChildState(state))` and `saveState()`, then awaits `saveProfileStateToCloud(activeProfileId, state)` directly. The direct write is needed because the 1.5 s debounced save would race the reload that follows. `localStorage.clear()` is gone, so the user stays signed in on the same child.
* **Latent test-helper bug fixed:** `setWipeDataMock(null)` left `wipeCloudDataFn = null`. It now restores the real function (the same `fn || default` pattern as `setSaveProfileRewardsMock`).
* **`admin.js`**: the confirm body names the child and states what's kept and that siblings are unaffected. The CTA changes from `Wipe Everything` to `Reset <name>` (still `pixel-btn danger`). The title `Wipe All Progress? 🚨` is unchanged, since TC27 pins it.
* **`index.html`** / **`style.css`**: a `.danger-zone-hint` under the button reads "Resets only the active child's progress…".

### Chart Style placeholder

* **`index.html`**: `#admin-chart-style-placeholder` (`aria-disabled="true"`) with a header, a `.coming-soon-tag`, a two-option `.admin-segmented` radiogroup (both `disabled`, Standard `checked`), and a hint. There are zero inline styles.
* **`style.css`**: `.admin-coming-soon` (with a `not-allowed` cursor), `.coming-soon-tag` (slate pill, readable), and `.admin-segmented` (opacity 0.55, grayscale, `pointer-events: none`). `.admin-segment` has a 44px minimum height, and the selected segment is shown via `:has(input:checked)`. Subtext uses `display: block` (Rule 10).

### Tests

* **TC89** (new, placed after TC27), 33 asserts:
  - (A) Pure builder: every preserved key survives, every progress field resets, the result is V18, the week re-anchors to the preserved day, and preserved values are deep copies.
  - (B) Real UI path: `setWipeDataMock(null)`, then passcode, Wipe, and confirm (copy and CTA checked). Progress is reset, identity and settings are kept, and reload is called.
  - (C) Placeholder: it exists and is `aria-disabled`, carries the tag, both radios are disabled, Standard is checked, clicking doesn't change anything, it writes no state, and it has zero `[style]` attributes.
  - It restores a state snapshot at the end.

### Docs

* **`docs/prd_admin_panel_redesign.md`** → **v1.1.0**:
  - D7 and D8 added to §2.
  - §1.3, §4.5, and the Stage 3 findings updated (Wipe risk resolved).
  - The placeholder is homed in the **Tasks** section.
  - The ID audit is now 26, and the redesign's new test is renumbered **TC89 → TC90**.
* **`README.md`**: two Parent Settings bullets.

### Verification

* `node --check` passes on app.js, admin.js, state.js, and tests.js. Audit: `blocks:77 unique:76 dupes:12`.
* Suite 100% green twice (25.8 s, then a repeat run with TC89's 33 asserts all passing).

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_62.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_62.md)

### Edited Files
* [`state.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/state.js): `WIPE_PRESERVED_KEYS`, `buildWipedChildState`.
* [`app.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js): `wipeActiveChildProgress`, import, `setWipeDataMock` fallback.
* [`admin.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/admin.js): per-child confirm copy and CTA.
* [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html): Chart Style placeholder, danger-zone hint, `?v=` bumps.
* [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css): placeholder and hint styles.
* [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): `poke-chart-cache-v165`.
* [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): TC89.
* [`docs/prd_admin_panel_redesign.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_admin_panel_redesign.md): v1.1.0.
* [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md): feature bullets.

---

## 6. Validation Instructions

1. **Production**: hard-refresh `https://crsjain.github.io/kepler-pokemon-chart/` and confirm cache `poke-chart-cache-v165`.
2. **Per-child Wipe (real Firestore, try it on a test child first)**: sign in, pick a child, then Admin (`zxcv`) → Danger Zone → *Wipe All Progress*.
   - The confirm should name the child. Press **Reset <name>**.
   - After reload you should still be on the same child: levels, badges, stars, and grid are reset, while activities, rewards, week start, and screensaver are unchanged.
   - Switch to the other child. Their progress should be untouched.
3. **Chart Style placeholder**: Admin → Activity Settings. The *🧸 Chart Style* block shows a *Coming soon* tag, both options are greyed out with a not-allowed cursor, and clicking does nothing.
4. **Automated Suite**: `node run_headless_tests.js`. Expect 100% pass.
