# PRD: "Week Over" State — Start New Week in the Week Header

**Document**: `docs/prd_week_over_start_new_week.md`
**Version**: 1.0.0
**Status**: Approved by owner 2026-11-01. **Not implemented yet.** It is waiting for a parallel thread's code changes to be committed. Reserves **TC131**.
**Authors**: crsjain & Jetski
**Target Systems**: `index.html`, `app.js`, `style.css`, `tests.js`, `service-worker.js`. **No schema change** (stays V19). No new column state.
**Companion docs**:
- [`prd_column_state_machine.md`](prd_column_state_machine.md): the 8 column states and the Back to Today pill (§5 item 7)
- [`prd_simplified_chart_style.md`](prd_simplified_chart_style.md) §3.3: Big Buttons day switching
- [`prd_parent_past_day_approval.md`](prd_parent_past_day_approval.md): the past-day PIN gate, which this feature keeps
- [`prd_admin_panel_redesign.md`](prd_admin_panel_redesign.md): Admin › Tonight's Check-in › *Start a new week*
- [`_agents/rules/ux-guidelines.md`](../_agents/rules/ux-guidelines.md): Rules 12, 13 and 22

---

## 1. Problem

A week can end before the grid is reset: today is past the last day of the active week. In that state the main screen looks broken.

**Triggering screenshot (2026-11-01, Sunday):**
- The child's grid still shows **Oct 25 – 31, 2026**, with SUN selected (`ACTIVE_PAST`, yellow).
- The header shows `⚡ Back to Today (Sunday)`. Tapping it does nothing and the pill stays.
- `🔄 Reset Week` sits low in the footer toolbar, where it is easy to miss.

**Root cause** (as of commit `042d169`):
1. `#back-to-today-btn` shows whenever a column is `ACTIVE_PAST` or `ACTIVE_FUTURE` (`app.js` ~L2119).
2. The week has no `SELECTABLE_TODAY` column, so the label falls back to today's *real* weekday name.
3. The click handler sets `state.activeDay = today's weekday` (`app.js` ~L3572). Weekday 0 maps back to **Sun Oct 25**, so the tap is a no-op.
4. A tablet left open overnight never clears the selected day. The realignment to `activeDay = -1` (`app.js` ~L1325) only runs on a profile's first load. On Sunday morning Saturday is still `ACTIVE_PAST`, and "Back to Today (Sunday)" jumps to *last* Sunday.

## 2. Goals and non-goals

**Goals**
- When the week is over, the main screen offers one clear, prominent next step: **🚀 Start New Week**, directly under the week dates.
- A child or parent can still go back and fix days of the ended week before starting the new one.
- `Back to Today` never shows when today isn't in the week being viewed.

**Non-goals**
- Any change to stars, XP, badges, rewards or Mega progress.
- Loosening the past-day Parent PIN gate (`requiresParentApproval` / `withParentApproval`).
- Changing *when* a new week can start. `canStartNextWeek` date logic stays as it is, including `pendingWeekStartDate`.
- Admin › Tonight's Check-in › *Start a new week* (`#admin-reset-week-btn`) keeps its label, its position and its plain "Reset Week Grid? 📅" confirm.
- Fixing the existing shared-`activeDay` behaviour across two tablets (see §7).

## 3. Definition: "week awaiting reset"

There is one derived predicate and no persisted field:

```js
// Week ended, grid not reset yet, and we're looking at the active week.
function isWeekAwaitingReset() {
  return !isViewingPastWeek() && canStartNextWeek(state, currentViewingWeekStartDate, /* forceCheck */ true);
}
```

`forceCheck = true` is required. Without it, `canStartNextWeek` returns `true` in test mode and with Future Edits on. The footer's "due" Reset button already uses this check (`app.js` ~L1854).

Three things read this helper, so they can never disagree:
- the header pill
- the Back to Today guard
- the overnight rollover tick

## 4. User experience

### 4.1 Scenarios

| # | Situation | Header (under "Oct 25 – 31, 2026") | Grid | Footer |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Child's chart loads after the week ended (or **Not Yet** on the new-week prompt) | `🚀 Start New Week` | **No active column.** Every non-superseded day is `SELECTABLE_PAST` (blue). | No Start / Reset button |
| 2 | Child or parent picks a day of the ended week | `🚀 Start New Week`. Back to Today **never** shows. | The chosen day is `ACTIVE_PAST` (yellow, editable). The others stay blue. | — |
| 3 | More fixes, then start the new week | Same as 2 | Switch between days as needed | — |
| — | Viewing an older archived week (`◀ Prev`) | Nothing | `HISTORICAL` | — |
| — | Exception Mode or Fix last week is active | Pill hidden (matches `applyWeekNavLock`) | Unchanged | — |
| — | Normal mid-week | `⚡ Back to Today` only when a non-today day is active (unchanged) | Unchanged | Unchanged |

Day switching in scenarios 2–3 works the same as today. With `lockPastDays` on it needs the **Parent PIN** (`withParentApproval`); otherwise it asks "Switch Day? 📅". A child alone can't backfill last week while the lock is on.

### 4.2 The header pill
- **Element:** `#reset-btn` moves from `.actions-buttons` (footer) into `.week-nav-center`, right after `#week-range-display`. The ID is kept, so it's still the only Start/Reset button on the main screen.
- **Label:** `🚀 Start New Week` in both themes (owner decision Q1: "Start", not "Reset"). Tooltip: *"Start your new week of training!"*
- **Colour:** the theme's bold "due" token (`--sk-due-*`: dark `#431407` on orange `#fb923c` / white on raspberry `#db2777`, both ≥ 4.5:1). **Never yellow**, because yellow means active / today (UX Rule 13.6).
- **Size:** a full-size touch target of at least **44px** high, not `small`. It has the theme's candy lip, and a pressed state that drops the lip (Rule 12).
- **Layout:**
  - Reserve the pill row's height in `.week-nav-center` so the grid doesn't jump between the three header states (Back to Today / Start New Week / nothing).
  - No horizontal scroll at ≥ 768px (Rule 13 §C). At 390px the pill stacks under the date between `◀ Prev` and `Next ▶`, and its label must not wrap.
- **Tap:** opens the **"Start New Training Week?"** dialog (owner decision Q3), not the plain "Reset Week Grid? 📅".
  - The auto prompt and the header pill share one function, `openStartNewWeekConfirm()`, extracted from `maybePromptNewWeek()`.
  - The dialog keeps:
    - the *"Missed a check last week? Tap Not Yet and finish it first"* nudge
    - the Week N / Mega-cycle framing
    - the **Carry over exceptions** checkbox
  - The auto prompt keeps its once-per-child-per-week-per-session rule. The pill always opens the dialog.

### 4.3 Back to Today
- Shows only when the viewed week has a `SELECTABLE_TODAY` column, and a non-today day is active.
- Its click lands on **today's column** (found from `colStates`), not just today's weekday number. That way a week-start shift can't bring the bug back.
- Mid-week behaviour is unchanged: no confirmation, and it ends the parent grace session.

### 4.4 Footer
- `🔄 Reset Week` is removed from the footer toolbar (owner decision Q4). The footer goes back to `version | Switch Trainer · Parent Admin`. UX Rule 22 is updated to match.

### 4.5 Big Buttons chart style (owner decision Q2: recommended option)
Today, `renderSimplifiedView()` falls back to column 0 when nothing is active, so Sunday looks focused. In the week-awaiting-reset state with no active day:
- **No day pill has the focus ring** (`.simplified-day-pill.is-focused` absent). Pills keep their stars, ❌ and 💤, and stay tappable. A tap goes through the same handler and PIN gate as §4.1.
- `#simplified-day-title` reads **"Last week is done!"**, with the theme's `dayTitleEmoji` in front.
- `#simplified-cards-list` shows **one calm card** in place of the task cards: *"Pick a day to fix, or start your new week 🚀"*. It has no candy lip and no hover lift, because the card itself is not a button. No glow, pulse or confetti.
- Once a day is picked (`ACTIVE_PAST`), the normal task cards for that day render as usual.

### 4.6 Overnight rollover
On the existing 60 s tick and on `visibilitychange` (next to `maybePromptNewWeek`): if `isWeekAwaitingReset()` and `state.activeDay !== -1`, set `activeDay = -1` and `saveState()` once. Skip this while:
- a `.modal` is open
- Exception Mode is on
- Fix last week is active

It writes **only on change**, because each `saveState()` is a debounced whole-state cloud write. Expose a test hook, since these timers don't run under `runTests`.

## 5. Owner decisions (2026-11-01)

| # | Question | Decision |
| :--- | :--- | :--- |
| Q1 | Pill copy | **`🚀 Start New Week`**, not "Reset Week" |
| Q2 | Big Buttons with no active day | **Recommended option:** no focused pill, plus one "Pick a day to fix, or start your new week 🚀" card |
| Q3 | Which confirm the pill opens | **The richer "Start New Training Week?" dialog** (shared with the auto prompt) |
| Q4 | Footer Reset button | **Removed.** One button on the main screen, plus the Admin row |

The plan went through the 5-stage feature review panel on 2026-11-01. Verdict: approved with mitigations. Every mitigation is folded into §4.

## 6. Implementation plan

**Precondition:** the parallel thread's code changes are committed and the tree is clean.

- [ ] **1. Helper:** add `isWeekAwaitingReset()` to app.js (§3).
- [ ] **2. Markup:** move `#reset-btn` into `.week-nav-center` with the new label and full-size classes. Remove it from `.actions-buttons`.
- [ ] **3. `renderState`:** show or hide the pill from the helper, and also hide it in Exception Mode and Fix last week.
- [ ] **4. Dialog:** extract `openStartNewWeekConfirm()` from `maybePromptNewWeek()`, and wire the pill to it in `bindResetEvents`. The Admin button keeps `openResetWeekConfirm()`.
- [ ] **5. Back to Today:** the `SELECTABLE_TODAY` guard in `updateActiveColumnUI`, and a click that targets today's column (§4.3).
- [ ] **6. Rollover:** add the rollover tick and its test hook (§4.6).
- [ ] **7. Big Buttons:** the no-focus ribbon, the title and the week-over card in `renderSimplifiedView` (§4.5).
- [ ] **8. CSS:** the header pill (due token, ≥ 44px, lip, reserved row height, 390px stack), the week-over card, and removal of the footer-only `.reset-due-btn` positioning.
- [ ] **9. Tests:** update TC130 (Reset now lives in the header, not the footer). Add **TC131** (§8).
- [ ] **10. Docs:**
  - [`prd_column_state_machine.md`](prd_column_state_machine.md): §5 item 7 and the §7 checklist
  - [`prd_simplified_chart_style.md`](prd_simplified_chart_style.md) §3.3
  - UX Rule 22
  - a changelog row in [`prd_admin_panel_redesign.md`](prd_admin_panel_redesign.md)
  - mark this PRD as implemented
- [ ] **11. Cache bump:** `CACHE_NAME`, `style.css?v=`, `app.js?v=` and all importmap entries (TC90). Then run the full suite, and run the CSS rig if the header layout moves.

## 7. Edge cases

- **Double tap on the pill:** the confirm dialog makes it a single action. After `resetWeekGrid`, the predicate turns false and the pill hides.
- **Pending start-day shift:** `canStartNextWeek` already uses `pendingWeekStartDate`. Superseded columns stay `SUPERSEDED` and can't be selected.
- **Two tablets:** `activeDay` lives in the shared state doc, so picking a day on one tablet moves the highlight on the other. This is existing behaviour and out of scope.
- **Not Yet:** closes the dialog and leaves scenario 1 (or 2) on screen with the pill visible.
- **Profile switch:** the first load already sets `activeDay = -1` when today isn't in the active week. Scenario 1 needs no new code for this path.

## 8. Verification — TC131

Mock the clock to **Sun 2026-11-01** with `weekStartDate = 2026-10-25` and `weekStartDay = 0`. Always use `forceCheck` semantics.

1. **Load:**
   - `#reset-btn` is visible inside `.week-nav-center`, and its text contains "Start New Week".
   - No `.day-header` has `data-column-state^="active"`.
   - `#back-to-today-btn` is hidden.
   - `.actions-buttons` contains no `#reset-btn`.
2. Select **Wed** (through the approval path when `lockPastDays` is on). Wed is `active_past`, the pill is still visible and Back to Today is still hidden.
3. Select **Fri**: the active column moves and the pill stays.
4. **Tap the pill:** the "Start New Training Week?" dialog opens with the Carry over checkbox. Confirm it: `weekStartDate === '2026-11-01'` and the pill is hidden.
5. **Overnight:** set `activeDay = 6` in the week-over state and call the rollover hook. `activeDay === -1`, and it saves once.
6. `◀ Prev`, Exception Mode and Fix last week each hide the pill.
7. **Big Buttons:**
   - no `.simplified-day-pill.is-focused`
   - the week-over card renders
   - picking a day renders that day's task cards
8. **Regression (mid-week):** select a past day, Back to Today shows, and tapping it returns to today's column with no modal.

Rough budget: ~2 s.
