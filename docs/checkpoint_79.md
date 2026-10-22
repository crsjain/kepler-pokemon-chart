# CHECKPOINT 79

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Future Edits survives reloads on the local site** (`7eb52d7`): owner picked "local test site only, per device, with a banner notice". On the live site it still resets on reload.
- [x] **"Pokémon Fled" text on fixed weeks** (`94754bd`, `2061bbd`, `56c7596`): any unwon past week that meets every goal (except all-rest weeks) shows a star badge on the week's colour with **"✅ Goal completed retroactively!"** (owner wording). The owner chose to keep the Mega card as is; the tooltip, the Fix last week dialog and the dock note say it doesn't count toward the Mega Milestone.
- [x] **Close the award gaps** (`94754bd`, `9c33800`): Exception Mode and saving Activities can now award *and* take back the current week's badge. Owner decisions:
  - **D1 b**: Exception Mode is judged once at Done ✅.
  - **D2 a**: an Activities save that would take back asks first.
  - **D3 a**: no warning in Exception Mode.
  - The take-back notice now gives the real count.
- [x] **Local test data** (conversation folder, not the repo; the code sets the local PIN to 2468): `test_family_badge_scenarios.md`, plus generator `scratch/make_test_family.py` (six scenario children T1–T6).
- [x] **Deleted activities are history-accurate** (`4e42e3a`): a deleted activity stays on every week it existed in, ticked or not. This replaces Checkpoint 35's hide-if-zero-ticks rule, which let a deletion rewrite past results.
- [x] **State 7 "Not on the plan"** (`18f7543`, `586ce24`): rest-day stripes + muted dash instead of a grey Pokéball. A ticked removal day keeps its Pokéball and counts. Goal counts on-plan days only (T4 reads 4 / 4, not 6 / 4). Source of truth: `prd_rest_day_passes_and_bonus_tasks.md` v2.2.0 §2.1 + UX Rule 14 item 6.
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
*   **Current Version**: Service Worker cache **`poke-chart-cache-v233`**. Asset tags: `style.css?v=11.03`, `app.js?v=11.04` (+ all 14 importmap entries `?v=11.04`), `particles.js?v=10.4`.
*   **Admin Password**: family Parent PIN at `users/{uid}.adminPassword` (legacy fallback `"zxcv"`). The **local** emulator currently holds the T1–T6 test family (PIN `2468`); the owner's live-site export (PIN `6878`) can be restored from the conversation folder.
*   **Local Server URL**: `http://localhost:8000/`. Emulator login `crsjain+staging@gmail.com` / `food3333`.
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Test Suite**: **113 blocks, 112 unique numbers** (`dupes:12`; gaps 40, 43, 44; max **126**; TC116 reserved; next free **127**). `node run_headless_tests.js` ~38–42 s.

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 64 §3](checkpoint_64.md). **No migration.** New logic is functional only:
- `isTaskOffPlan(task, dateStr)` (state.js)
- `getTaskRequiredDays(taskId, weekStartDate)`
- `weekMeetsEveryGoal(weekStart, tasks)` (app.js)
- localStorage `kpc_debug_future_edits` (local test site only)

---

## 4. Work Accomplished

### Weekly-win rules
* **`app.js`**:
  - `weekMeetsEveryGoal` is shared by the live win and past weeks; an all-rest week (nothing required, nothing ticked) never counts.
  - `checkAndTriggerWeeklySuccess()` runs after ticks, at Exception Mode Done ✅ (`stopExceptionMode`), and after saving Activities (`recheckWeeklyGoals`).
  - `describeWeeklyBadgeLoss` and `getShortTasksThisWeek` support the save warning and the "N more checks" copy.
* **`admin.js`**: `saveAdminTasks` snapshots `state.tasks`, applies the draft, and restores it plus asks *"Take back this week's badge? ⚠️"* when the save would revoke (`confirmedBadgeLoss`).

### Past-week display
* **`app.js`**: `renderProgress` shows `.goal-completed-star` (`EARNED_STAR_HTML` on `badge-theme-N`) and "✅ Goal completed retroactively!" for unwon-but-complete past weeks. The Mega-not-counting note appears in the tooltip, `showLastWeekCompleteNotice` and `LAST_WEEK_SUB_COMPLETE`.

### Activities over time
* **`app.js`**:
  - `isTaskActiveInWeek` is history-accurate (`createdAt <= weekEnd && deletedAt > weekStart`).
  - State 7 rendering uses `isTaskOffPlan` and an `offPlanTooltip`; the Goal column counts on-plan days.
  - Exception Mode ignores off-plan cells.
* **`state.js`**: `isTaskOffPlan`; `getTaskRequiredDays` and `getActiveTasksForDate` use it.
* **`style.css`**: `.out-of-range-cell` stripes + `::after` dash, Pokéball hidden.

### Debug
* **`app.js`**: `isFutureEditsRemembered` / `rememberFutureEdits` and an env banner suffix.

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_79.md`](checkpoint_79.md): this checkpoint.

### Edited Files
* [`app.js`](../app.js), [`state.js`](../state.js), [`admin.js`](../admin.js), [`style.css`](../style.css), [`index.html`](../index.html), [`service-worker.js`](../service-worker.js): the changes described above.
* [`tests.js`](../tests.js): TC1 (history-accurate deletion), TC117 (real count), TC118 and TC124 (updated), new TC123, TC125, TC126.
* [`docs/prd_rest_day_passes_and_bonus_tasks.md`](prd_rest_day_passes_and_bonus_tasks.md) (v2.2.0), [`docs/prd_parent_edit_last_week.md`](prd_parent_edit_last_week.md), [`_agents/rules/ux-guidelines.md`](../_agents/rules/ux-guidelines.md) (Rule 14 item 6), [`README.md`](../README.md).

---

## 6. Validation Instructions

1. **Cache**: hard-refresh the live site and confirm `poke-chart-cache-v233`.
2. **Local scenarios**: restore the T1–T6 code from `test_family_badge_scenarios.md` (valid through Oct 24) and follow its checklists.
3. **Kepler's Thursday star (live site)**: Fix Oct 11 - 17 → Thu Math → Star Vault streak.
4. **Automated Suite**: `node run_headless_tests.js`; verify 100% pass (113 blocks).
