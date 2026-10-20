# CHECKPOINT 78

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Weekly badge not retracted on untick** (`ecce894`): crsjain: *"Kepler preemptively clicked the Thu math pokeball which granted him the umbreon badge … We then unchecked the pokeball … but the badge was not retracted."* `checkAndTriggerWeeklySuccess` only ever awarded. An untick that drops the week below its goals now retracts the claim, this week's Badge Case copy (older copies from earlier cycles are kept) and the claimed-reward log entries.
- [x] **Calm setback pop-ups** (`dca2241`): retraction shows `🔒 BADGE LOCKED AGAIN` (names the short activity, greyed badge, `I'll win it back! 💪`). The owner asked to make the devolve pop-up calm too: `😢 POKÉMON DEVOLVED / Oh no!` → `🔄 TIME TO TRAIN … Earn more XP to evolve again!`. One modal per untick (`addXp(…, { quiet })`).
- [x] **Fix last week** ([PRD](prd_parent_edit_last_week.md); `20926bf`, then `8e48268`, `5d4a9f1`, `022f80c`): the owner wanted to restore Kepler's broken streak (Thu 10/15 Math done but not ticked before Reset) through the UI. Decisions: Q1 timer yes, Q2 most recent week only (copy must make the limit read as intentional), Q3 badges/rewards/Mega frozen after reviewing the risks, Q4 live celebrations yes. Follow-ups this session:
  - The row moved to the end of *Tonight's Check-in*.
  - The completion note became a dialog plus a yellow dock note (*"too subtle"*).
  - The note fired wrongly because past weeks used the **current** week's exceptions; `getTaskRequiredDays(taskId, weekStartDate)` now takes the week.
- [x] **Mega Milestone pop-up** (`03e1e07`, `7547075`): badge circles must match the main-screen Mega card. Both now render from `getMegaSlotBadges()`. Rewards show their list label (`🍦 Sweet Victory: Special Dessert Outing!`, not the stored value `Dessert Outing`). Reward names are capped at 60 characters.
- [x] **New-week prompt** (`c494485`, `472544d`): *"I don't want 'Start New Training Week?' to appear immediately after the weekly success … A child can accidentally hit yes and freeze an incorrect week."* `maybePromptNewWeek()` now offers it only once the active week is over, and `Reset Week Grid` stays greyed out until then, even after a win.
- [x] **Exception Mode + Prev** (`9f859a0`): Prev/Next are disabled in Exception Mode (they used to exit it silently).
- [x] **Family restore "nothing happens"** (`c9ccc08`): on the local site, the restore waited silently while the emulator was down and then landed on reconnect. It now shows `STILL RESTORING ⏳` after 8 s.
- [x] **Manual test plan** (`cb14ced`, `5c27019`): [`test_plan_badge_retraction_and_fix_last_week.md`](test_plan_badge_retraction_and_fix_last_week.md).
- [ ] **Acceptance on prod: Kepler's Thursday star.** After this deploy: Admin › Settings › `✏️ Fix Oct 11 - 17` → tick Thu Math Practice → Done ✅ → the Star Vault streak runs Wed 10/14 → Fri 10/16.

### Known Follow-ups / Nice-to-haves

- [ ] **§7 Phase 3: remove `adminPassword` from per-child state (V20).** Earliest **2026-10-26**; re-verify the doc field in the Firebase console first. TC116 stays reserved.
- [ ] **Fixed-week badge panel wording** (offered, not yet answered): a fixed week that now meets every goal still reads *"🏃 The Pokémon Fled! (Goal Not Reached)"*. Suggested: *"Goals met after the fact — badge not awarded"*.
- [ ] **Claimed-rewards history shows stored values** (e.g. `Dessert Outing`), not list labels. Only the success modals were changed.
- [ ] **Persist the Future Edits debug switch on localhost** (offered): today it resets on every reload.
- [ ] **Real-Firebase check, remaining half** (carried): changing the family password signs out the kids' tablets.
- [ ] Carried: optional "This is a parent device" toggle, stale-module error on localhost, viewport sweep in the toolchain, "Rest whole day" shortcut, historical task order after a reorder, remaining kid-side inline styles (Rule 8), `viewport-fit=cover`, Chart Style (under 5) PRD, logged-in manual check, test-harness sleep savings.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v226`**. Asset tags: `style.css?v=11.01`, `app.js?v=10.97` (+ all 14 `<script type="importmap">` entries `?v=10.97`), `particles.js?v=10.4`.
*   **Admin Password**: the family-wide **Parent PIN** at `users/{uid}.adminPassword` (legacy fallback `"zxcv"`).
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`). Emulator login `crsjain+staging@gmail.com` / `food3333`. The local emulator now holds a restore of the **prod family** (Kepler, Lyra, Alden; PIN `6878`). Lyra's Oct 12–18 week was ticked during testing.
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Audio/Volume Settings**: Unchanged.
*   **Test Suite**: **109 blocks, 108 unique numbers** (`dupes:12` expected; gaps `40, 43, 44`; max **122**; TC116 reserved for §7 Phase 3; next free **123**). Run via `node run_headless_tests.js` (~35–42 s; it can hit the 60 s watchdog under cloudtop load, so rerun and `git checkout -- screenshot_timeout.png`).

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 64 §3](checkpoint_64.md). **No migration.** Everything added this session is runtime-only (`lastWeekEditStart`, `newWeekPromptedFor`, `lastWeekWasComplete`) or a function signature (`getTaskRequiredDays(taskId, weekStartDate = state.weekStartDate)`).

---

## 4. Work Accomplished

### Badge retraction & calm notices
* **`app.js`**: `revokeWeeklySuccess(changedTaskId)` and `showBadgeLockedAgainNotice`. `checkAndTriggerWeeklySuccess(changedTaskId)` revokes when an untick drops the week below its goals. `addXp(amount, { quiet })`. Devolve copy changed to `🔄 TIME TO TRAIN`.
* **`badges.js`**: `revokeCurrentWeeklyBadge(weekStart)` removes only a copy earned on or after the week start.
* **`style.css`**: `.badge-locked-again .notif-img` greyscale.

### Fix last week
* **`app.js`**: `lastWeekEditStart`, `getLastArchivedInterval`, `startLastWeekEdit` / `endLastWeekEdit` / `handleLastWeekToggle`, `refreshFixLastWeekButton`, `archivedWeekMeetsEveryGoal`, `showLastWeekCompleteNotice`. It rides on the grace session (`clearParentGrace` ends it). `isLastWeekEditCell` un-disables `HISTORICAL` cells; there is no new column state.
* **`index.html`**: `#admin-fix-last-week-btn` row (last in Tonight's Check-in); `#parent-grace-label` / `#parent-grace-sub` in the dock.
* **`style.css`**: `.parent-grace-dock.last-week-mode`, `.parent-grace-sub(.week-complete)`, `.layout-container.last-week-edit`.
* **`state.js`**: `getTaskRequiredDays(taskId, weekStartDate)`. Past-week Goal columns and the completion check use their own week's exceptions.

### Week rollover safety
* **`app.js`**: `isNewWeekDue` / `maybePromptNewWeek` (at profile load, every 60 s, on `visibilitychange`; once per child and week; never over a modal or parent mode). The success notice no longer chains into the reset confirm. `canStartNextWeek` dropped `|| weeklyClaimed`. `applyWeekNavLock()` locks Prev/Next in Exception Mode and Fix last week.

### Mega modal & rewards
* **`app.js`**: `getMegaSlotBadges()` is shared by the main card and the modal. `getRewardLabel(value, options)`.
* **`rewards_admin.js`**: `REWARD_NAME_MAX = 60` on the add and rename inputs.

### Family restore feedback
* **`admin.js`**: `importCloudState` shows `STILL RESTORING ⏳` after `cloudRestoreSlowMs` (8 s; seam `setCloudRestoreSlowMsMock`).

### Other (concurrent session)
* **`run_emulator.sh`** (`d0cfd42`, another session): pins `firebase-tools` 15.24.0.

---

## 5. Files and Code

### Created Files
* [`docs/prd_parent_edit_last_week.md`](prd_parent_edit_last_week.md): Fix last week spec (v1.0.0, implemented).
* [`docs/test_plan_badge_retraction_and_fix_last_week.md`](test_plan_badge_retraction_and_fix_last_week.md): manual test plan.
* [`docs/checkpoint_78.md`](checkpoint_78.md): this checkpoint.

### Edited Files
* [`app.js`](../app.js), [`badges.js`](../badges.js), [`state.js`](../state.js), [`admin.js`](../admin.js), [`rewards_admin.js`](../rewards_admin.js), [`style.css`](../style.css), [`index.html`](../index.html), [`service-worker.js`](../service-worker.js): the changes described above.
* [`tests.js`](../tests.js): TC45 (new-week prompt at load), the canStartNextWeek lifecycle check, the family-restore offline step, and new TC117–TC122.
* [`README.md`](../README.md), [`_agents/AGENTS.md`](../_agents/AGENTS.md): new features, PRD and test-plan links.

---

## 6. Validation Instructions

1. **Cache**: hard-refresh `https://crsjain.github.io/kepler-pokemon-chart/` and confirm `poke-chart-cache-v226`.
2. **Kepler's Thursday star (acceptance)**: select Kepler, then Admin › 🗓️ Settings › `✏️ Fix Oct 11 - 17`. Tick Thu Math Practice (`+20 XP! 🎉`, ❌ → 🌟), then Done ✅. In Star Vault, the streak runs Wed 10/14 → Fri 10/16.
3. **Rollover**: mid-week, `Reset Week Grid` is greyed out. After the week ends, `Start New Training Week? 📅` appears once.
4. **Exception Mode**: Prev/Next are disabled until Done ✅.
5. Full manual pass: [`test_plan_badge_retraction_and_fix_last_week.md`](test_plan_badge_retraction_and_fix_last_week.md).
6. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass (109 blocks).
