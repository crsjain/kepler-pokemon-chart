# Technical Implementation Plan: Dynamic Week Boundaries & Historical Archiving (v2.1)

This document outlines the step-by-step engineering plan to implement the approved PRD v2.1 for Dynamic Week Boundaries, Partial Week Rendering, and Smart Start-Day Transitions.

---

## Phase 1: Dynamic Boundary Algorithm (`date_utils.js` / `app.js`)

### 1.1. Implement `getHistoricalWeekIntervals(state)`
- Create a pure, deterministic helper `getHistoricalWeekIntervals(state)` that:
  1. Collects all sorted keys from `state.weeklyHistory` plus `state.weekStartDate`.
  2. For each key $K_i$ at index $i$:
     - Determines `weekStartDay` from `state.weeklyHistory[K_i].weekStartDay` (or `state.weekStartDay` for current week).
     - Calculates nominal end date: $K_i + 6\text{ days}$.
     - Determines `nextStartDate`: $K_{i+1}$ if $i < \text{total}-1$, otherwise `null`.
     - Calculates `actualEndDate`: $\min(\text{nominalEndDate}, \text{nextStartDate} - 1\text{ day})$ if $K_{i+1}$ exists, else $\text{nominalEndDate}$.
     - Calculates `isPartial`: `actualEndDate < nominalEndDate`.
     - Generates array of `activeDates` and `supersededDates`.
     - Formats human-readable range string: e.g., `"Mon, Jul 20 – Thu, Jul 23 • 4 Days (Start Day Adjusted 📅)"` or `"Mon, Jul 13 – Sun, Jul 19"`.
  3. Returns ordered array of interval descriptor objects:
     ```javascript
     {
       startDate: "2026-07-20",
       actualEndDate: "2026-07-23",
       nominalEndDate: "2026-07-26",
       weekStartDay: 1,
       isPartial: true,
       activeDaysCount: 4,
       rangeDisplay: "Mon, Jul 20 – Thu, Jul 23 • 4 Days",
       supersededDates: ["2026-07-24", "2026-07-25", "2026-07-26"],
       isCurrentWeek: false,
       history: { ... }
     }
     ```

---

## Phase 2: Grid Table & Superseded Styling (`app.js` & `style.css`)

### 2.1. Dynamic Header Names by Viewing Week
- In `renderGridTable()`:
  - Retrieve the interval object for `currentViewingWeekStartDate`.
  - Use `interval.weekStartDay` instead of `state.weekStartDay` to calculate day header abbreviations (`SUN`, `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`).

### 2.2. Superseded Cell Styling (`style.css`)
- Define `.superseded-cell` class:
  - Background: Subtle diagonal hatch stripes (`repeating-linear-gradient(45deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 10px, transparent 10px, transparent 20px)`).
  - Disabled / dashed placeholder checkbox.
  - Set `title="These days moved to your new chart! 🚀"`.
- In daily total row:
  - Render superseded cells with a muted hatch icon / strike rather than failing red `"❌"`.

### 2.3. Badge Morale & Status Chips
- In `renderState()`:
  - If viewing an unclaimed cut-short week, render a badge chip: `"Rolled forward to new chart ➡️"`.

---

## Phase 3: Chronological Interval Navigation (`app.js`)

### 3.1. Interval-Based Navigation
- Update `#prev-week-btn`:
  - Find current index in `getHistoricalWeekIntervals(state)`.
  - If index $> 0$, set `currentViewingWeekStartDate = intervals[index - 1].startDate`.
  - Disable button if index $=== 0$.
- Update `#next-week-btn`:
  - If index $< \text{intervals.length} - 1$, set `currentViewingWeekStartDate = intervals[index + 1].startDate`.
  - Disable button if viewing active week (`index === intervals.length - 1`).

---

## Phase 4: Smart Start-Day Transition in Parent Admin (`app.js` & `admin.js`)

### 4.1. Concrete Date Preview Modal
- When `adminWeekStartSelect` changes:
  - Calculate target start dates:
    - Target A (This week's occurrence): $\text{getWeekStart}(\text{today}, \text{newStartDay})$.
    - Target B (Upcoming week's occurrence): $\text{Target A} + 7\text{ days}$.
  - If Target A $< \text{state.weekStartDate}$, automatically use Target B (preventing backward inversion).
  - If Target A $\ge \text{state.weekStartDate}$, show modal with clear radio/action options showing concrete date ranges (e.g. `"Wed, Jul 22 – Tue, Jul 28"` vs `"Wed, Jul 29 – Tue, Aug 4"`).
- On confirmation:
  - Archive active week into `state.weeklyHistory[oldWeekStartDate]`.
  - Update `state.weekStartDate = chosenDate` and `state.weekStartDay = newStartDay`.
  - Preserve `state.megaWeeks` (do not increment on partial cut).
  - Prune 0-day or 0-completion micro-entries.

### 4.2. Day-of-Week Exception Carry-Over
- Update `carryOverExceptions` logic to map by weekday name (e.g., Monday excuse $\rightarrow$ Monday in new week).

---

## Phase 5: Automated Testing & Verification (`tests.js`)

### 5.1. Test Cases
- **Test Case 59: Dynamic Week Interval Resolution & Boundary Calculations**:
  - Assert `getHistoricalWeekIntervals` correctly identifies partial vs full weeks, superseded dates, and accurate range strings.
- **Test Case 60: Partial Week 7-Column Grid Rendering & Superseded Styling**:
  - Assert day headers render based on historical `weekStartDay`, active days show completions, and superseded days receive `.superseded-cell` class and tooltips.
- **Test Case 61: Discrete Chronological Paging Navigation**:
  - Assert `#prev-week-btn` and `#next-week-btn` step through discrete intervals and handle boundary states correctly.
- **Test Case 62: Admin Smart Start-Day Transition & Mega Milestone Integrity**:
  - Assert changing start day archives partial slice without incrementing `megaWeeks`, anchors dates properly, and prunes micro-weeks.

### 5.2. Verification
- Run `node run_headless_tests.js` to ensure 100% pass across all regression tests in ~17s.
