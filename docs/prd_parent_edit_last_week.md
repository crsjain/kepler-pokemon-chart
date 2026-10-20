# PRD: Fix Last Week (Parent Editing of the Most Recent Archived Week)

**Document**: `docs/prd_parent_edit_last_week.md`
**Version**: 1.0.0
**Status**: Implemented locally (TC118), not yet deployed.
**Authors**: crsjain & Jetski
**Target Systems**: `app.js`, `admin.js`, `index.html`, `style.css`, `tests.js`. **No schema change** (stays V19).
**Companion docs**: [`prd_parent_past_day_approval.md`](prd_parent_past_day_approval.md) (grace session + bottom dock this feature reuses), [`prd_column_state_machine.md`](prd_column_state_machine.md) (the `HISTORICAL` column state), [`prd_star_vault.md`](prd_star_vault.md) §3.2.1 (rest-day streak rule), [`prd_historical_weeks.md`](prd_historical_weeks.md) (week intervals and archiving), [`_agents/rules/ux-guidelines.md`](../_agents/rules/ux-guidelines.md).

---

## 1. Problem

Archived weeks are strictly read-only (`HISTORICAL` column state: `isCellDisabled = true`, `pointer-events: none`), even for parents. When a child really did an activity but the week was reset before it was ticked, nobody can fix it in the app.

**Triggering incident (2026-10-18):** Kepler finished Thursday 2026-10-15 Math Practice but pressed Reset before ticking it. Thursday shows ❌, so the Star Vault streak broke between Wed 10/14 and Fri 10/16. The only fix was a laptop + backup-code round trip, which isn't realistic from the tablet.

A related bug (commit `ecce894`) let an early tick + untick leave the weekly badge claimed, which is why Reset was enabled mid-week. That is fixed separately: an untick that drops the week below its goals now retracts the badge.

## 2. Goals and non-goals

**Goals**
- A parent can tick or untick pokeballs and bonus tasks in **the most recent archived week** from the tablet, without a laptop.
- Stars, the streak, partner XP and the week's XP total update the same way a live tick would.
- No new kid-facing affordance. Lyra can't reach it.

**Non-goals**
- Editing weeks older than the most recent archived one.
- Changing that week's **badge, weekly/Mega reward claim, or Mega Milestone progress**. These are frozen at reset (§4.3).
- Editing rest days 💤 or turning cells into bonus ✨ (Exception Mode stays current-week only).
- Any persisted field or migration.

## 3. User experience

### 3.1 Entry point (parent-only)
- **Admin › 🗓️ Settings** gets a new `.adm-setting-row`, placed **last** in the Tonight's Check-in card, after the current-week and past-day controls (owner request, 2026-10-20). The copy names the exact week and says up front that only that week can be fixed, so the limit reads as a rule, not a bug (owner request, Q2):
  - Label: **Fix last week**
  - Help: *"Tick activities that were done but missed before the reset. Only the most recent week can be fixed — older weeks stay locked so their stars and badges are settled."*
  - Button: `#admin-fix-last-week-btn` (`adm-secondary`), labelled with the dates: **"✏️ Fix Oct 11 – 17"** (from the archived interval's `rangeDisplay`).
- With no archived week (a new child), the button is disabled and the help says *"Available after your first week is reset."*
- Admin is already behind the Parent PIN, so **no second PIN prompt**.

### 3.2 Edit mode
On tap:
1. Admin closes. The grid navigates to the most recent archived week (`currentViewingWeekStartDate = lastArchivedWeekStart`).
2. `.layout-container` gets the class `last-week-edit`. Editable cells in that week become interactive with the amber parent tint used by Exception Mode (`#fffbeb`, full opacity).
3. A bottom floating dock appears (*Persistent Mode Toolbars & Floating Dock Hierarchy*), reusing the `#parent-grace-dock` styling:
   - `✏️ EDITING LAST WEEK` (typographic mode label, coral uppercase, no button styling)
   - sub-label *"Stars & XP update · badges don't change"*
   - countdown timer (see §3.3)
   - **Done ✅**, the only button
4. **Prev / Next** week buttons are disabled while editing, with the tooltip *"Only last week can be fixed"*. The mode is tied to one week.

### 3.3 Session lifetime
- Runtime-only, never persisted (same rule as the grace session in `prd_parent_past_day_approval.md` §2.2).
- Ends on: **Done ✅**, timer expiry, profile switch, page refresh/PWA close, or opening Admin.
- Timer length reuses the child's `parentGraceMinutes` (1 / 2 / 5, default 2). See Q1.
- When it ends, the grid returns to the current week and the notice *"Edit window closed 🔒 — back to this week!"* appears (only on expiry, matching the grace session).

### 3.4 What a tap does

| Cell | Tap in edit mode |
| :--- | :--- |
| Normal, unchecked | Ticks it (Pokéball turns red) |
| Normal, checked | Unticks it |
| Bonus ✨ unchecked / Great Ball | Ticks / unticks the bonus |
| Rest 💤 | Inert (unchanged) |
| Superseded (hatched) | Inert (unchanged) |
| Outside the archived interval (shortened weeks) | Inert (unchanged) |

Feedback is the same as a live tick: the check/uncheck sound, the XP float (`+5 XP`, `+20 XP! 🎉` when the day completes, `+10 XP (Bonus!)`), and the Daily Total star/❌ updating in place. Level-up and evolution celebrations fire normally because the XP is real. Losing XP uses the calm devolve notice. **No weekly-success celebration** and no "BADGE LOCKED AGAIN" notice, because badges are frozen.

## 4. Rules

### 4.1 Which week is "last week"
The archived interval immediately before `state.weekStartDate`, from `getHistoricalWeekIntervals(state)`. Shortened weeks (Case A/B in `prd_historical_weeks.md`) work unchanged: only the dates inside that interval are editable.

### 4.2 Effects of one toggle (`key = "YYYY-MM-DD-taskId"`)
1. `wasComplete = isDayComplete(dateStr, state)`
2. `state.grid[key] = checked`
3. `isComplete = isDayComplete(dateStr, state)`
4. XP delta = ±`XP_PER_TASK` (5), or ±`XP_BONUS_TASK` (10) for a bonus cell, plus ±`XP_DAILY_BONUS` (15) if the day crossed complete ↔ incomplete. Applied with `addXp(delta)` to the **current** active partner.
5. `checkDayCompleted(dateStr, isComplete)`: adds or removes the Star Vault date. This must be called explicitly, because `runStateDiagnostics` only re-syncs the current week.
6. `state.weeklyHistory[weekStart].xpEarned = calculateWeekXpEarned(weekStart)`
7. `saveState()`, then re-render (`renderState(true)`).

The rest-day rule (`isRestDay`, the 2026-09-30 cutoff) applies as-is. A completed day bridges the streak exactly like a live completion.

### 4.3 Frozen: badges, rewards, Mega Milestones
The edit path **never** calls `checkAndTriggerWeeklySuccess`, and never touches `weeklyClaimed`, `weeklyHistory[week].weeklyClaimed/badgeId/megaWeeks`, `collectedBadges`, `activeWeeklyBadgeId`, `badgePool`, `megaWeeks` or `claimedRewardsHistory`.

*Why:* at reset, the archived week has already decided the badge outcome, rolled the next badge, and moved Mega progress forward. Re-deciding it later would cascade through every week after it. If a fixed week "should" have won its badge, the parent handles the reward in real life.

**Parent heads-up:** if a fix makes an archived week that was saved as *not won* meet every goal, a parent dialog opens (**🎉 LAST WEEK NOW MEETS EVERY GOAL**, naming the reward(s) to give in person; owner 2026-10-20: the dock note alone was too easy to miss) and the dock sub-label switches to a highlighted *"Last week now meets every goal 🎉 — badges don't update; give the reward in person."* That way the parent isn't left wondering why no badge appeared.

### 4.4 XP goes to today's partner
If the child switched partners since that week, the XP goes to the partner active now. That's acceptable: XP is a reward for the child's effort, not a record of history.

## 5. Engineering design

- **State:** module-level `let lastWeekEditStart = null;` in `app.js` (runtime-only). Helpers: `startLastWeekEdit()`, `endLastWeekEdit({ notify })`, `isLastWeekEditCell(dateStr)`.
- **Rendering:** where inputs are disabled (`shouldDisable = isOutOfRange || col.isCellDisabled || isRest`, two sites in `app.js`), allow interaction when `isLastWeekEditCell(col.dateStr)` and the cell isn't rest/superseded. Keep `data-column-state="historical"`. **No new column state.** The amber tint comes from `.layout-container.last-week-edit .historical-cell` in `style.css`.
- **Handler:** at the top of `handleCheckboxChange`, before the `isCellDisabled` guard, branch to a new `handleLastWeekToggle(e)` that implements §4.2. It skips the active-day switch, the parent-approval gate (already a parent), and the reward-chosen gate.
- **Dock:** extend `#parent-grace-dock` with a mode modifier (`.parent-grace-dock.last-week-mode`) and a hidden sub-label span, instead of new markup. Timer and Done reuse `startParentGrace` / `clearParentGrace` with a mode flag.
- **Teardown hooks:** profile switch, Admin open, and grace expiry call `endLastWeekEdit()`.
- **Exports:** no new `app.js` exports (TC69 pins 11). The Admin button calls in through the existing `initAdmin(appCallbacks)` injection.
- **Cache busting:** bump `CACHE_NAME` and every `?v=` entry (TC90).
- **Estimated size:** ~150 lines of JS, ~25 of CSS, ~6 of HTML.

### 5.1 Edge cases
- **Firestore snapshot mid-edit:** `renderState(true)` keeps edit mode because the flag is module-level. Cloud overwrites follow existing last-write-wins behavior.
- **Rapid taps:** each tap is an idempotent toggle of one key. XP is derived from the before/after day completion, so mashing can't mint XP.
- **No archived week (new child):** the button is disabled.
- **Mega/evolution modals stacking:** same as live ticks today. No new stacking path.

## 6. Test plan — TC118

1. Seed an archived week (using `weeklyHistory` + a past `weekStartDate`) with a day that's one tick short and a missing Star Vault date.
2. Admin › Settings › **Fix last week** → Admin closes, the view is on that week, `.last-week-edit` is present, the dock shows `EDITING LAST WEEK`, and Prev/Next are disabled.
3. Tap the short cell → the grid key is true, the date is added to `earnedDates`, partner XP +20, `weeklyHistory[week].xpEarned` is recomputed, and no `.notif-modal` with weekly success.
4. Assert `weeklyClaimed`, `collectedBadges`, `megaWeeks` and `weeklyHistory[week].weeklyClaimed/badgeId` are unchanged.
5. Untick it → everything reverses (−20 XP, date removed).
6. Rest cell tap → no change.
7. **Done ✅** → mode off, view back on the current week, past-week cells disabled again.
8. Without edit mode, a past-week cell stays inert (regression guard for kids).

## 7. Owner decisions

| # | Question | Decision |
| :--- | :--- | :--- |
| Q1 | Should edit mode auto-end on a timer? | **Yes** (2026-10-19): reuse `parentGraceMinutes` (default 2 min). |
| Q2 | Allow editing only the most recent archived week, or also older ones? | **Most recent only** (2026-10-19). The Admin copy must make the limit read as intentional (§3.1). |
| Q3 | Should a fixed week that now meets every goal award its badge after the fact? | **No, frozen** (2026-10-19), after reviewing the risks: mid-week badge-target and reward swaps, surprise Mega completion, double awards, and take-backs. The dock tells the parent when a fix completes an unwon week (§4.3). |
| Q4 | Show live-tick celebrations (XP float, day-complete burst, level-up) during a fix? | **Yes** (2026-10-19). |

## 8. Rollout

- [x] Owner answers Q1–Q4 (2026-10-19)
- [x] Implement + TC118, suite green, cache bump (v217, modules 10.89, style 11.00)
- [ ] Deploy via `pokemon-session-wrapup`
- [ ] **Acceptance on prod:** use Fix last week to tick Kepler's Thu 2026-10-15 Math Practice and confirm the Star Vault streak rejoins Wed 10/14 → Fri 10/16 (Sat 10/17 is a 💤 bridge day).
