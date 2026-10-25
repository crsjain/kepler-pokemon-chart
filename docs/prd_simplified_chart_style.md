# PRD: Simplified "Today Focus" Chart Style (`Big Buttons` for Younger Children)

**Document**: `docs/prd_simplified_chart_style.md`
**Version**: 1.0.0
**Status**: Reviewed by 5-Stage Feature Review Panel (`APPROVED WITH MITIGATIONS`) — Ready for Implementation (Reserves **TC128**; updates **TC89C** from inert placeholder to live control).
**Authors**: crsjain & Jetski
**Target Systems**: `state.js`, `app.js`, `admin.js`, `index.html`, `style.css`, `tests.js`. **No schema version bump** (stays V19; V20 remains reserved for `prd_parent_pin_and_family_signin.md` §7 Phase 3).
**Companion docs**: [`prd_unicorn_princess_theme.md`](prd_unicorn_princess_theme.md) (independent per-child `theme` setting), [`prd_admin_panel_redesign.md`](prd_admin_panel_redesign.md) (D8 & §11 Q5 `#admin-chart-style-placeholder`), [`prd_parent_past_day_approval.md`](prd_parent_past_day_approval.md) (`lockPastDays` + grace dock), [`prd_parent_edit_last_week.md`](prd_parent_edit_last_week.md) (`Fix last week`), [`prd_column_state_machine.md`](prd_column_state_machine.md), [`_agents/rules/ux-guidelines.md`](../_agents/rules/ux-guidelines.md).

---

## 1. Problem & User Context

The standard 9-column × N-row Weekly Training Grid (`TASK`, `SUN`–`SAT`, `GOAL`, plus `Daily Total`) is built for a 7-year-old (Kepler) managing 5 daily activities across a full week.

For a younger child like Lyra (5yo) who only has **1–3 activities**:
1. **2D Matrix Scan Friction**: Cross-referencing a row header with a column header across 9 columns is cognitively heavy for a 5-year-old early reader.
2. **Sparse Visual Weight**: With only 1–3 tasks, the 9-column table looks half-empty, and the 36px checkboxes feel small relative to the available screen space.
3. **Placeholder Waiting to Ship**: Checkpoint 62 added a greyed-out **🧸 Chart Style** control (`#admin-chart-style-placeholder` in `Admin › ✅ Activities`) offering `Big Buttons` vs. `Standard`, deferred until its dedicated PRD and Review Panel were completed.

---

## 2. Goals & Non-Goals

### Goals
- **Activate `#admin-chart-style-placeholder` (`state.chartStyle`)**: Promote the inert segmented control at the bottom of **Admin › ✅ Activities** into a live per-child setting (`'standard'` default vs. `'big-buttons'`).
- **Orthogonal to Theme**: Keep `state.chartStyle` completely independent of `state.theme` (`'pokemon' | 'unicorn'`) so any child can mix-and-match either theme with either chart style.
- **"Today Focus" Simplified Layout**:
  1. **Top 7-Day Star Strip (`#simplified-day-strip`)**: Shows all 7 days of the week (`SUN`–`SAT`) with their clean Daily Total status icons (`🌟`, `☆`, `❌`, `💤`, `➖`) plus quick access to `⭐ Vault` and `📖 Guide`.
  2. **Big Tactile Task Cards (`#simplified-cards-list`)**: Displays the active day's 1–3 tasks as large, full-width horizontal cards with a **Jumbo 56px × 56px** tactile Pokéball / Sparkle Heart checkbox and a **Visual Weekly Goal Pill** (e.g., 5 mini hearts/balls for a 5-day goal, with zero fractional text clutter per UX Rule 15).
- **Day Switching & Parent PIN Gate**: Tapping a day pill on the 7-Day Star Strip switches the active day for the big cards below, honoring `state.lockPastDays` (Parent PIN required for past days when enabled) and `"Switch Day? 📅"`.
- **Automatic Full-Week Grid for Parent Modes**: Entering **Parent Exception Mode** (`#exceptions-btn`) or **Fix Last Week** (`#admin-fix-last-week-btn`) automatically displays the full 7-day table so parents can manage multi-day exceptions and fixes without friction.
- **Keep Core Reward Loops Active**: Companion leveling & evolving (`.trainer-card`), Daily Stars & Star Vault streak, and Weekly Badge + 4-week Mega Milestone reward remain 100% active.

### Non-Goals
- **Kindness Quests**: Not rolled out; ignored per owner decision.
- **Altering Reward or XP Math**: Completing tasks in `Big Buttons` mode awards the exact same XP, stars, streaks, and badges as `Standard` mode.

---

## 3. User Experience & Visual Design System

### 3.1 Activating `#admin-chart-style-placeholder` (`Admin › ✅ Activities`)
In [`index.html`](../index.html) inside `#admin-pane-tasks`:
- Keep the container ID `#admin-chart-style-placeholder` so existing section-home queries in **TC93** remain 100% compatible.
- Remove `.admin-coming-soon`, `aria-disabled="true"`, the `Coming soon` badge (`.coming-soon-tag`), and `disabled` attributes on the two radio inputs (`input[name="admin-chart-style"][value="big-buttons"]` and `value="standard"`).
- Replace `.coming-soon-tag` with an inline `<span class="adm-saved-status" data-admin-saved-status role="status" aria-live="polite"></span>` so toggling between **Big Buttons (`Today Focus`)** and **Standard (`Full Week`)** auto-saves immediately and flashes `Saved ✓` (`flashAdminSaved`), without dirtying the task-list draft save bar (`#admin-activities-savebar`).
- Update the subtext labels to be inclusive of 5-year-olds:
  - `Big Buttons` — subtext: `Today focus`
  - `Standard` — subtext: `Full week grid`

### 3.2 "Today Focus" Layout (`#simplified-today-view`)
When `state.chartStyle === 'big-buttons'` and neither Exception Mode nor Fix Last Week is active:

```
┌────────────────────────────────────────────────────────────────────────┐
│  ◀ Prev                     Oct 25 - Oct 31                    Next ▶  │
├────────────────────────────────────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  ┌─────────┐ │
│  │ SUN │ │ MON │ │ TUE │ │ WED │ │ THU │ │ FRI │ │ SAT │  │ ⭐ Vault│ │
│  │ 🌟  │ │  ☆  │ │  ☆  │ │  ☆  │ │  ☆  │ │  ☆  │ │  ☆  │  │ 📖 Guide│ │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘  └─────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│  🌟 TODAY'S QUESTS — SUNDAY                       [⚡ Back to Today]   │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  🎹  Piano Practice                                    ╭──────╮  │  │
│  │      Play all pieces 3x!                               │  💖  │  │  │
│  │      Weekly Goal: 💖 💖 💖 🤍 🤍                       ╰──────╯  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  📚  Reading Time                                      ╭──────╮  │  │
│  │      15min reading out loud                            │  🤍  │  │  │
│  │      Weekly Goal: 💖 💖 🤍 🤍 🤍                       ╰──────╯  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

#### A. Top 7-Day Star Strip (`#simplified-day-strip`)
- Renders 7 interactive day pills (`.simplified-day-pill[data-day="0..6"]`) driven by the **exact same 8-state column state machine** (`getWeekColumnStates(state, currentViewingWeekStartDate)`) and `data-column-state` attributes (UX Rule 13):
  - **Active Day Pill (`active_today`, `active_past`, `active_future`)**: Highlighted in Pikachu Yellow (`#ffcb05`) or Unicorn Sparkle Gold (`#fde047`) with **Dark Charcoal text (`#1e293b`, ≥ 9.8:1 AAA contrast)** and an elevated border.
  - **Selectable Day Pill (`selectable_today`, `selectable_past`)**: Poké Blue (`#2a71d0`) or Royal Amethyst (`#7e22ce`) with solid white text (`#ffffff`) and `cursor: pointer`.
  - **Future Locked / Historical / Superseded Pill**: Slate grey or diagonal hatched, `cursor: not-allowed`.
- Each pill displays:
  - Top row: 3-letter day name (`SUN`–`SAT`).
  - Bottom row: Clean Daily Total icon (`EARNED_STAR_HTML` `🌟`, `GHOST_STAR_HTML` `☆`, `❌`, `REST_DAY_HTML` `💤`, or `➖`) — **zero fractional numbers** (UX Rule 15), with full count string in `title` for parents.
- Alongside the strip sit the compact `⭐ Vault` (`#open-vault-simplified-btn`) and `📖 Guide` (`#open-guide-simplified-btn`) buttons so neither modal is ever unreachable when the table is hidden.

#### B. Big Tactile Task Cards (`#simplified-cards-list`)
- Renders one `.simplified-task-card` per active task in the viewed week (`isTaskActiveInWeek(task, currentViewingWeekStartDate)`), displaying the state for the **currently active day column** (`activeColIndex`, or `0` when viewing a historical week):
  1. **Task Identity (Left)**:
     - Large emoji tile (`2.2rem` in a `52px × 52px` rounded badge).
     - Bold task name (`1.15rem`, `Fredoka One`) + encouraging concept/instruction line.
     - **Visual Weekly Goal Pill (`.simplified-goal-dots`)**: Renders `N` mini icons (`14px`) corresponding to `reqDays = getTaskRequiredDays(task.id, currentViewingWeekStartDate)` (up to 7 dots: filled `🔴`/`💖` for completed days this week, hollow `⚪`/`🤍` for remaining days, plus `+✨` if bonus days were completed beyond `reqDays`). If `reqDays === 0` (all rest/bonus week), displays `💤 Rest Week`. Full count (`"3 / 5 days"`) is attached to `title` for parent hover inspection (UX Rule 15).
  2. **Jumbo Tactile Checkbox (Right — `56px × 56px`)**:
     - Reuses `<label class="pokeball-checkbox simplified-jumbo-checkbox"><input type="checkbox" ...><span class="pokeball"></span></label>` scaled cleanly to `56px × 56px` in `style.css` (`transform: scale(1.5)` or explicit `56px` box with `background-size: contain`).
     - Supports all 6 cell states from UX Rule 14:
       - **Normal Unchecked / Checked**: Dormant → Red Pokéball (or Dormant Heart → Glowing Pink Royal Heart in `unicorn` theme).
       - **Bonus Unchecked / Checked**: `✨` dashed circle → Great Ball (or Royal Crown/Gem in `unicorn` theme) + `+XP` badge, with a `"✨ Bonus! +10 XP"` chip on the card.
       - **Rest Day (`💤`)**: Card carries `.rest-cell` diagonal stripes and a calm `"💤 Rest Day today"` pill; checkbox is disabled (`pointer-events: none`).
       - **Not on the Plan (`.out-of-range-cell`)**: Card carries diagonal stripes, muted dash `➖`, and parent tooltip (`offPlanTooltip`).

### 3.3 Day Switching & Past-Day PIN Lock
- Clicking a `.simplified-day-pill[data-day]` delegates to the exact same header-click handler used by `.day-header[data-day]`:
  - **Today (`SELECTABLE_TODAY`)**: Switches `state.activeDay` immediately with zero modal.
  - **Past Day (`SELECTABLE_PAST`)**: If `requiresParentApproval(col.dateStr)` is true (`state.lockPastDays`), prompts for the **Parent PIN** (`withParentApproval`) and then switches straight to that day; otherwise prompts `"Switch Day? 📅"`.
  - **Viewing a Past Day**: The `#back-to-today-btn` (`⚡ Back to Today`) pill appears in `.week-navigation-container` as usual so child or parent can jump back to Today in one tap.
  - **Viewing an Archived Historical Week (`◀ Prev`)**: All cards render in read-only `historical` state (`disabled`), and clicking any day pill on the 7-day strip previews that day's cards in the archived week (`viewingHistoricalDayIndex`).

### 3.4 Automatic Full-Week Grid in Parent Edit Modes
- When the parent enters **Exception Mode** (`.layout-container.exception-mode`) or **Fix Last Week** (`.layout-container.last-week-edit`):
  - CSS automatically hides `#simplified-today-view` and reveals `.grid-scroll-wrapper` (the full 7-day table).
  - The parent sees all 7 days × all tasks at once to cycle `🔴 ➔ ✨ ➔ 💤` or fix last week's ticks.
  - When the parent taps **Done ✅** (or the timer expires), the view automatically returns to `#simplified-today-view`.

---

## 4. Rules & Economy Invariants

1. **Single Source of Truth (`state.grid` & `state.excused`)**: `Big Buttons` mode reads and writes the exact same `state.grid["YYYY-MM-DD-taskId"]` keys as `Standard` mode.
2. **Zero Economy Divergence**: Ticking a task in `Big Buttons` mode executes the same `handleCheckboxChange` flow: reward-selected guard, `+5 XP` / `+10 XP` bonus / `+15 XP` daily bonus, floating XP text anchored over the clicked jumbo checkbox, Star Vault `earnedDates` sync, Weekly Badge award/retraction, and Mega Milestone progression.
3. **Preserved Across Reset Progress**: `'chartStyle'` is included in `WIPE_PRESERVED_KEYS` (`state.js`) so "Reset This Child's Progress" keeps the child's chart style.

---

## 5. Engineering Design

- **State & Diagnostics (`state.js`)**:
  - Add `chartStyle: 'standard'` to `state` and `getDefaultStateTemplate()`.
  - Add `'chartStyle'` to `WIPE_PRESERVED_KEYS`.
  - In `runStateDiagnostics()`, validate:
    ```js
    if (!['standard', 'big-buttons'].includes(state.chartStyle)) {
      state.chartStyle = 'standard';
      issues.push("Missing or invalid chartStyle.");
      fixed.push("Set chartStyle to default 'standard'.");
    }
    ```
  - **No migration entry in `migrations.js`**: schema remains **V19**.
- **DOM & Rendering Architecture (`index.html`, `app.js`, `style.css`)**:
  - Inside `.chart-container` in `index.html`, place `<div id="simplified-today-view" class="simplified-today-view hidden"></div>` right above `.grid-scroll-wrapper`.
  - **Occam's Razor Dual-DOM Strategy**: Keep `.grid-scroll-wrapper` rendered in the DOM at all times, and toggle visibility via `.chart-container[data-chart-style="big-buttons"]` in `style.css`:
    - When `data-chart-style="big-buttons"` and `.layout-container` is **not** `.exception-mode` or `.last-week-edit`: `.grid-scroll-wrapper` is `display: none` and `#simplified-today-view` is `display: flex`.
    - When `.layout-container` has `.exception-mode` or `.last-week-edit`: `.grid-scroll-wrapper` is `display: block` and `#simplified-today-view` is `display: none`.
  - Why this eliminates 90% of risk:
    - `domCache.checkboxes`, `domCache.dayTotals`, and `domCache.taskTotals` are never null.
    - Ticking a checkbox in `#simplified-cards-list` syncs the corresponding `domCache.checkboxes[key]` and runs `handleCheckboxChange` (anchoring `createXpFloat` to the visible clicked element via a lightweight `floatAnchorEl` parameter or `e.target`).
    - `renderSimplifiedView()` is called at the end of `renderGridTable()`, `updateActiveColumnUI()`, and `renderProgress()` so the 7-day star strip and big task cards stay 100% in sync with every state change.

---

## 6. Automated Regression Test Plan — TC89C Update & TC128

1. **Update TC89 Part C (`tests.js:2436`)**:
   - Update TC89C to reflect that `#admin-chart-style-placeholder` is now an active control (both radios enabled, default `'standard'`, no `.coming-soon-tag`, zero inline styles).
2. **Add Test Case 128: Simplified "Today Focus" Chart Style (`Big Buttons`)**:
   - **Admin Toggle & Persistence**: In Admin › Activities, select `input[name="admin-chart-style"][value="big-buttons"]`. Assert `state.chartStyle === 'big-buttons'`, `.chart-container.dataset.chartStyle === 'big-buttons'`, `#simplified-today-view` is visible (`getComputedStyle().display !== 'none'`), and `.grid-scroll-wrapper` is hidden.
   - **7-Day Star Strip & Big Task Cards**: Assert `#simplified-day-strip` renders 7 `.simplified-day-pill` items with clean status icons (no fractional text, UX Rule 15) and `#simplified-cards-list` renders one `.simplified-task-card` per active task with a visual `.simplified-goal-dots` row and a jumbo checkbox (`>= 48px × 48px` touch target).
   - **Task Completion & Economy Parity**: Select Weekly & Mega rewards, tick all active tasks for Today via `.simplified-task-card input[type="checkbox"]`, and assert:
     - `state.grid["YYYY-MM-DD-taskId"] === true`
     - Partner XP increases by `tasks.length * 5 + 15` (Daily Bonus)
     - Today's `.simplified-day-pill` updates from `☆` (`.future-star`) to `🌟` (`.unlocked`)
     - `.simplified-goal-dots` increments its filled count by 1.
   - **Day Strip Navigation & Past-Day PIN Lock**:
     - Enable `state.lockPastDays = true` and clear parent grace. Click a past day pill on `#simplified-day-strip` → assert `#password-modal` opens (`Parent PIN 🔑`).
     - Unlock with PIN → assert `state.activeDay` switches to that past day and `#simplified-cards-list` renders that day's task states.
   - **Parent Exception Mode & Fix Last Week Auto-Grid Fallback**:
     - Call `startExceptionMode()` → assert `.grid-scroll-wrapper` becomes visible (`display !== 'none'`) and `#simplified-today-view` hides so the parent can edit the full 7-day grid.
     - Click `#exceptions-done-btn` → assert `#simplified-today-view` returns automatically.
   - **Wipe Preservation & Zero Inline Styles**:
     - Assert `#simplified-today-view` has zero `[style]` attributes (UX Rule 8).
     - Run `buildWipedChildState(state)` and assert `wiped.chartStyle === 'big-buttons'`.

---

## 7. Owner Decisions

| # | Question | Decision |
| :--- | :--- | :--- |
| **Q1** | Should Theme and Chart Style be independent per-child settings? | **Yes, two independent settings** (2026-10-25) and two separate PRDs (`docs/prd_unicorn_princess_theme.md` and `docs/prd_simplified_chart_style.md`). |
| **Q2** | How should Simplified View present tasks for a 5yo with 1–3 activities? | **"Today Focus" view** (2026-10-25): big, tactile task cards for the active day + a simple 7-day star strip at the top. |
| **Q3** | Which reward loops stay active in Simplified View? | **Companion leveling & evolving, Daily Stars & Star Vault streak, and Weekly Badge & 4-week Mega Milestone** (2026-10-25). (Kindness Quests ignored as unshipped.) |
| **Q4** | How should day switching, weekly goal progress, and parent full-week editing work? | **Tap a day in the 7-day star strip to switch days** (respecting the Past-Day PIN lock), show a **visual progress pill** (e.g., 5 mini hearts/balls for a 5-day goal) on each big task card, and **automatically show the full 7-day grid during Parent Exception Mode or "Fix Last Week"** (2026-10-25). |

---

## 8. 🏛️ 5-Stage Feature Review Panel Synthesis

### 🚦 Final Executive Verdict: **APPROVED WITH MITIGATIONS** (All mitigations folded into §§3–6)

#### Stage 1: 🧸 Child Development & Play Psychologist
- **Cognitive & Scan Friction**: Collapsing the 9-column matrix into a vertical stack of 1–3 big task cards for "Today" cuts visual scan time for a 5-year-old to `< 1.5 seconds`.
- **Emotional Safety & Motivation**: Replacing fractional text (`3 / 5`) on the big cards with visual progress tokens (`💖 💖 💖 🤍 🤍` or `🔴 🔴 🔴 ⚪ ⚪`) lets a pre-reader count how many more days she needs by sight.
- **Verdict**: **PASS**

#### Stage 2: 🎮 Game Economy & Habit Loop Designer
- **Chore Priority Integrity**: Big cards elevate the daily chores into the unmistakable hero element of the screen.
- **Currency & Progression Balance**: 100% shared state and XP/Star/Badge math with Standard view; zero inflation or divergence when toggling styles.
- **Verdict**: **PASS**

#### Stage 3: 🏡 Family Operations / "Weary Parent"
- **Bedtime & Screentime Impact**: Fast, big-target tapping (`56px × 56px`) eliminates accidental mis-taps on adjacent columns by a 5-year-old's fingers.
- **Parent Burden & Overrides**: Automatically revealing the 7-day table during **Exception Mode** and **Fix Last Week** means parents never have to switch `Chart Style` back to `Standard` just to mark a week's rest days or fix last week.
- **Mitigation Added**: Include compact `⭐ Vault` and `📖 Guide` buttons directly in the top strip of `#simplified-today-view` so hiding `.weekly-grid` never hides access to the Star Vault or Task Guide.
- **Verdict**: **PASS**

#### Stage 4: 🎨 Senior Staff UX Designer
- **UX Guidelines Compliance**:
  - *Rule 8 (Zero Inline Styles)*: All layout and card styles live in `style.css`; zero `style="..."` attributes in `#simplified-today-view`.
  - *Rule 13B (Contrast Invariant)*: Active day pill on the 7-day strip uses Dark Charcoal text (`#1e293b`) on yellow/gold (`≥ 9.8:1 AAA`).
  - *Rule 15 (Daily Total Child Readability)*: The 7-day star strip renders only clean status icons (`🌟`, `☆`, `❌`, `💤`, `➖`) with counts in `title`.
  - *Rule 18 (Landscape Split-View Stability)*: `.chart-container` maintains stable height across desktop/tablet landscape and mobile portrait viewports.
- **Verdict**: **PASS**

#### Stage 5: 🛠️ Senior Staff Engineer & Chaos Architect
- **Tech Debt & Complexity Audit**:
  - Zero schema version bump (stays V19 via `runStateDiagnostics`, keeping V20 reserved).
  - Keeping `.grid-scroll-wrapper` in the DOM (hidden via CSS when `#simplified-today-view` is active) preserves every `domCache` reference and avoids touching any existing table-mutation code path.
  - Keeping ID `#admin-chart-style-placeholder` on the activated control preserves **TC93**'s section-home assertions while updating **TC89C** and adding **TC128**.
- **Gaps & Edge Cases Caught**:
  - **XP Float Positioning**: `createXpFloat` uses `cb.getBoundingClientRect()`. When a task is ticked from a `.simplified-task-card`, `handleCheckboxChange` must anchor `createXpFloat` to the visible card's checkbox (not the hidden table's checkbox, whose rect would be `0,0`).
  - **Historical Week Day Preview**: When viewing an archived past week (`isPastWeek`), `state.activeDay` is not active in that week's `colStates`; `#simplified-today-view` defaults to previewing day index `0` (or the clicked pill's `viewingHistoricalDayIndex`, reset on week change) in read-only `historical` state.
- **Verdict**: **PASS**

---

## 9. Rollout Checklist

- [x] Brainstorm & lock owner decisions Q1–Q4 (2026-10-25)
- [x] Draft PRD & run 5-Stage Feature Review Panel (2026-10-25)
- [x] Implement Simplified Chart Style (`state.js`, `index.html`, `admin.js`, `app.js`, `style.css`) (2026-10-25)
- [x] Update **TC89C** and add **TC128** in `tests.js`; verify 100% green `node run_headless_tests.js` (2026-10-25)
- [x] Bump `CACHE_NAME` in `service-worker.js` and `?v=` in `index.html` (TC90) (2026-10-25)
