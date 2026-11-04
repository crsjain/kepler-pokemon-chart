# CHECKPOINT 87

This document contains a complete, chronological record of user requests, system
configurations, version progress, and active schema definitions for the
application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **"Week over" state: Start New Week in the header** (owner, 2026-11-01). PRD: [`docs/prd_week_over_start_new_week.md`](prd_week_over_start_new_week.md) v1.1.0. Implemented in `3e160b9` (TC131).
  - **Ask:** after the week ends and before the grid is reset, the owner's screenshot showed `⚡ Back to Today (Sunday)` stuck in the header. Tapping it did nothing, because it jumped to last week's Sunday. Reset Week sat low in the footer. The owner proposed moving Reset into Back to Today's spot, with 3 scenarios:
    1. The chart loads with no day highlighted.
    2. Picking a previous day highlights it, and Back to Today doesn't show.
    3. Fix any days, then start the new week.
  - **Root cause:** Back to Today showed for any `ACTIVE_PAST` column. With no `SELECTABLE_TODAY` column it was labelled with today's weekday, and its click set `activeDay` to that weekday, which is the same column of the ended week. A tablet left open overnight also kept the old `activeDay`, because the realignment to `-1` only ran on profile first load.
  - **Owner decisions (2026-11-01):**
    - Q1: the label is `🚀 Start New Week`, not "Reset".
    - Q2: Big Buttons uses the recommended no-focus + week-over card.
    - Q3: the button opens the rich "Start New Training Week?" dialog.
    - Q4: the footer Reset button is removed.
  - The 5-stage feature review panel approved the plan with mitigations; all of them are folded into the PRD.
  - **Deviations from the PRD, both written back into it:**
    - The pill row's height is not reserved. Reserving it would make the header taller every day.
    - On phones (≤ 520px) the pill drops to its own centred row.
- [ ] **Owner manual test** with the local test plan and family code. Kepler and Alden were rewound to the Oct 25–31 week. Lyra is in her ended Oct 26 – Nov 1 week with the PIN lock on. The local PIN in that code is 2468. Both files live in conversation folder `5abb71b8-…` (`week_over_test_plan.md`, `week_over_test_family_code.txt`), not in the repo.
- [ ] **Carried:**
  - Owner visual check of CP86 (Mega past weeks).
  - Owner tablet check from CP85.
  - VQA of CP84 items.
  - Prod acceptance of Kepler's Thursday star via Fix last week.

### Known Follow-ups / Nice-to-haves

- [ ] **Headless CDP scripts hang at `Page.navigate`** (seen 2026-11-03 after a server restart). Both `tools/css_rig/capture.js` and a scratch copy hung, even with `--no-proxy-server`, while `run_headless_tests.js` worked. Not investigated. Re-check before relying on the CSS rig. Screenshots this session were taken with `gbrowser` instead.
- [ ] `activeDay` is stored in the shared state doc, so picking a day on one tablet moves the highlight on another. This is existing behaviour and out of scope (PRD §7).
- [ ] Admin › *Start a new week* still opens the plain "Reset Week Grid? 📅" confirm, and its label says `🔄 Reset Week` (PRD non-goal; parent-facing).
- [ ] Carried from CP86:
  - The "THIS WEEK'S BADGE" legacy earned-date fallback.
  - The Change Week Start Day smart-consolidation edge.
  - Deferred style.css cleanup items.
  - Phone Big Buttons Vault 50.5px.
  - `#vault-debug-panel` styling.
  - Goal column tight at ~1024px.
  - Unicorn Phase 1 gaps / Phase 2 companions.
  - Star shower ignores reduced motion.
  - §7 Phase 3 (V20, **TC116** reserved).
  - Kid-side inline styles.
  - `viewport-fit=cover`.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v278`**. Asset tags: `style.css?v=11.39`, `app.js?v=11.38` + all 14 importmap entries `?v=11.38`, `particles.js?v=10.8`. App label still `v1.8.0 (v58)`.
*   **Admin Password**: family Parent PIN at `users/{uid}.adminPassword` (legacy fallback `"zxcv"`). Never commit backup codes: they carry the PIN and the repo is public.
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`).
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Test Suite**: **120 blocks, 119 unique numbers** (`dupes:12`; gaps 40, 43, 44; max **133**; TC116 reserved; next free **134**). `node run_headless_tests.js` ~30–36 s.

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 82 §3](checkpoint_82.md). **No schema bump or migration this session.** "Week awaiting reset" is derived (`canStartNextWeek(..., true)` on the live week). The rollover guard `weekOverActiveDayClearedFor` is in-memory per session, not persisted.

---

## 4. Work Accomplished

### Week over: Start New Week in the header
* **`index.html`**: `#reset-btn` moved from the footer `.actions-buttons` into `.week-nav-center`, after the date. It is now `pixel-btn warning start-week-pill`, labelled `🚀 Start New Week`. The footer comment was updated.
* **`app.js`**:
  - `isWeekAwaitingReset()`: the live week is shown and `canStartNextWeek(..., forceCheck = true)` is true.
  - `updateStartNewWeekButton()`: called from `applyWeekNavLock()`, so it also runs in Exception Mode and Fix last week. It shows the pill only while the week is awaiting reset and no parent mode is on. `disabled` keeps the old `canStartNextWeek` gate (test mode / Future Edits).
  - Back to Today needs a `SELECTABLE_TODAY` column, and its click lands on today's column.
  - `openStartNewWeekConfirm()` was extracted from `maybePromptNewWeek()`. Both the pill and the auto prompt use it. Its copy now says "Start a fresh grid for Week N".
  - `clearActiveDayIfWeekOver()` runs on the 60 s tick and on `visibilitychange`. It runs once per child + week per session; the first load pre-marks the week. It writes only on change and skips while a modal, Exception Mode or Fix last week is open.
  - Big Buttons with no active day: no focused pill, the title reads "Last week is done!", and `.simplified-week-over-card` shows.
  - New test helpers: `clearActiveDayIfWeekOver`, `resetWeekOverRolloverKey`, `isWeekAwaitingReset`.
* **`style.css`**:
  - `.start-week-pill`: ≥ 44px, `8px 20px`, `1rem`, nowrap.
  - A ≤ 520px rule (`:has(.start-week-pill:not(.hidden))`, `.week-nav-center { display: contents }`, `::after` line break) puts the pill on its own row.
  - The skin rule moved from `.actions .reset-due-btn` to `.week-navigation-container .start-week-pill`, keeping the `--sk-due-*` colours.
  - `.simplified-week-over-card` (base + skin, no lip).
* **`tests.js`**:
  - TC130 now expects the footer to hold only Switch Trainer / Parent Admin, with the pill in the header.
  - New TC131 covers:
    - scenarios 1–3
    - the dead Back to Today regression
    - the rollover (clears once, keeps later picks)
    - Exception Mode / older week hiding
    - Big Buttons card and focus
    - the rich dialog and the new week
    - mid-week Back to Today

### Docs
* **`docs/prd_week_over_start_new_week.md`**: new PRD (`1f3e360`), updated to v1.1.0 with the implemented status, notes and layout deviations.
* **`docs/prd_column_state_machine.md`** (Back to Today rule), **`docs/prd_simplified_chart_style.md`** §3.3, **`docs/prd_admin_panel_redesign.md`** (changelog row), **`_agents/rules/ux-guidelines.md`** Rule 22, **`_agents/AGENTS.md`** (reference row), **`README.md`** ("New Week Only When the Week Ends" bullet).

---

## 5. Files and Code

### Created Files
* [`docs/prd_week_over_start_new_week.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_week_over_start_new_week.md): PRD.
* [`docs/checkpoint_87.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_87.md): this file.

### Edited Files
* [`app.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js), [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html), [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css), [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js), [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js) (`v278`).
* [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md), [`_agents/AGENTS.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/AGENTS.md), [`_agents/rules/ux-guidelines.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/rules/ux-guidelines.md), and the three PRDs listed in §4.

---

## 6. Validation Instructions

1. **After deploy, on a tablet whose child's week has ended but isn't started** (e.g. Lyra on a Monday or later):
   - The `🚀 Start New Week` pill is under the dates and no day is highlighted.
   - Picking a day highlights it (PIN if locked), and Back to Today never shows.
   - The pill opens "Start New Training Week?".
2. **Mid-week**: Back to Today still appears after picking another day and returns to today with no dialog.
3. If stale: Admin › Data › Reload latest version (`v278`).
4. **Local walkthrough:** the test plan in conversation `5abb71b8-…` (`week_over_test_plan.md`).
5. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass.
