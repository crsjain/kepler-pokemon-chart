# Product Requirement Document (PRD): Historical Week Archive, Restoration & Dynamic Boundaries (v2.0)

**Status:** Approved / Ready for Implementation  
**Author:** crsjain & Jetski  
**Last Updated:** 2026-08-15  
**Version:** 2.0 (Dynamic Week Boundaries & Partial Week Transitions)

---

## 1. Executive Summary
The Pokémon Training Chart tracks daily habits, weekly rewards, badges, and partner evolution progress. Historical week browsing allows children and parents to look back at past accomplishments.

In v1.0, the app used rigid 7-day fixed arithmetic navigation (`±7 days`), which assumed the `weekStartDay` never changed. If a parent shifted the start day (e.g., from Monday to Friday), past weeks were rendered using the new start day, causing past completions and earned badges to be displayed against the wrong calendar days and creating misleading historical views.

**v2.0 introduces Dynamic Week Boundary Resolution**:
- Historical weeks accurately reflect the **real calendar span** and **historical start day** under which they were completed.
- Weeks cut short by a start-day change render as **partial weeks**: active days show true completions, and superseded days display a distinct **diagonal hatched disabled state** with tooltips (`"Moved to next week"` / `"Week ended early"`).
- Weekly navigation (`<- Prev` / `Next ->`) seamlessly steps through the **chronological sequence of recorded historical intervals**.
- Badges and Star Vault entries remain strictly associated with the specific days on which they were earned.

---

## 2. Motivation & Problem Statement
1. **Misaligned Historical Views**: Changing the week start day in Admin caused previous weeks to shift their day columns, distorting the day on which tasks and badges were actually completed.
2. **Missing Partial Week Representation**: When a parent changes the start day mid-cycle (e.g., Friday after 4 days of Monday-start training), the prior 4 days became awkward to view or navigate.
3. **Rigid ±7 Day Paging**: Stepping backward by 7 fixed days caused navigation to land on incorrect non-boundary dates when start days were altered over time.
4. **Badge Context Preservation**: Children love reviewing the specific badges they earned during specific weeks; badges must accurately match the active days of that week.

---

## 3. Goals & Non-Goals

### Goals
- **True Historical Fidelity**: Each past week renders using its own historical `weekStartDay` and actual active date span.
- **Dynamic Boundary Resolution**: Automatically infer week cutoffs from the chronological timeline without requiring brittle database migrations.
- **Partial Week Visuals**: Render 7 columns per historical start day, with superseded/overlapping days clearly hatched and disabled.
- **Chronological Interval Navigation**: Prev/Next buttons jump sequentially across discrete recorded week intervals.
- **Fair Badge Qualification**: Require full 7-day completion for weekly badges, while allowing overlapping days to count toward the newly started week.
- **Zero Data Loss & Grandfathering**: Existing claimed badges and legacy `weeklyHistory` entries remain 100% intact.

### Non-Goals
- Allowing children or unauthenticated users to edit historical weeks (history remains strictly read-only).
- Converting the app into a complex multi-month calendar view (maintains the focused 7-day training chart experience).

---

## 4. Technical Design & Architecture

### 4.1. Data Structures & Schema
The state maintains its calendar-keyed architecture:
```javascript
state = {
  version: 18,
  weekStartDay: 5,            // Active start day (e.g., 5 = Friday)
  weekStartDate: '2026-07-24', // Active week start date
  grid: {
    '2026-07-20-piano': true,  // Monday in cut-short week
    '2026-07-24-piano': true   // Friday in new week
  },
  excused: { ... },
  weeklyHistory: {
    '2026-07-20': {
      weekStartDay: 1,         // Historical start day (Monday)
      reward: 'Bonus Game Time',
      megaReward: 'Card Pack',
      weeklyClaimed: false,
      badgeId: 152,
      xpEarned: 80,
      megaWeeks: 0
    }
  }
};
```

### 4.2. Dynamic Boundary Resolution Algorithm
Rather than storing rigid hardcoded end-dates in storage, the active timeline of historical weeks is dynamically computed via `getHistoricalWeekIntervals(state)`:

1. **Collect all boundaries**:
   - Gather all keys from `state.weeklyHistory` sorted chronologically in ascending order, along with `state.weekStartDate`.
2. **Compute interval bounds**:
   - For each historical week $W_i$ at index $i$:
     - `startDate` = $K_i$
     - `nominalEndDate` = `startDate + 6 days`
     - `nextStartDate` = $K_{i+1}$ (or `state.weekStartDate` if $W_i$ is the last historical week).
     - `actualEndDate` = `min(nominalEndDate, nextStartDate - 1 day)`.
     - `activeDaysCount` = `(actualEndDate - startDate) + 1`.
     - `isPartial` = `actualEndDate < nominalEndDate`.
     - `supersededDates` = Array of dates from `actualEndDate + 1 day` to `nominalEndDate`.
3. **Paging Timeline**:
   - The timeline array `[W_0, W_1, ..., W_current]` forms the exact discrete steps for `#prev-week-btn` and `#next-week-btn`.

---

## 5. UI & UX Specifications

### 5.1. Header Date Range Display
The main header (`#week-range-display`) dynamically reflects the real active span:
- **Full 7-Day Week**: `"Mon, Jul 13 – Sun, Jul 19"`
- **Partial / Cut-Short Week**: `"Mon, Jul 20 – Thu, Jul 23 (4 Days)"`

### 5.2. 7-Column Grid Rendering
- **Column Headers**: Dynamically computed from the viewing week's `weekStartDay` (e.g., for `weekStartDay = 1`, columns are `MON, TUE, WED, THU, FRI, SAT, SUN`).
- **Active Days** ($D \le \text{actualEndDate}$): Render task checkboxes, completions, and daily totals as normal (read-only in historical view).
- **Superseded Days** ($D > \text{actualEndDate}$):
  - Styled with CSS class `.superseded-cell`.
  - Background styling: Subtle diagonal stripe pattern (`repeating-linear-gradient(...)`).
  - Checkbox / Pokeball replaced with a disabled dashed placeholder or muted icon.
  - Hover tooltip / title attribute: `"Moved to next week"` or `"Week ended early"`.
  - Column total cell rendered with a muted strike/hatch icon.

### 5.3. Navigation Controls
- `#prev-week-btn`: Moves to the immediately preceding week interval in the timeline. Disabled when at the earliest interval.
- `#next-week-btn`: Moves to the next week interval in the timeline. Disabled when viewing the current active week (`state.weekStartDate`).

---

## 6. Week Transition & Archiving Lifecycle

### 6.1. Changing Start Day in Parent Admin
When a parent changes the `weekStartDay` in Admin settings:
1. **Archive Active Slice**: The current week (`state.weekStartDate`) is archived into `state.weeklyHistory[oldWeekStartDate]` with its current `weekStartDay`, `reward`, `megaReward`, and `activeWeeklyBadgeId`.
2. **Compute New Active Week Start**:
   - `state.weekStartDate = formatLocalDate(getWeekStart(today, newStartDay))`.
   - `state.weekStartDay = newStartDay`.
3. **Carry Forward Overlapping Checks**:
   - Since task completions are keyed by calendar dates (`YYYY-MM-DD-taskId`), completions on dates that fall within the new week range are automatically visible and counted toward the new week's total and badge.
4. **Pruning Micro-Weeks**:
   - If changing start days produces a historical entry with 0 completed tasks and length $\le 1$ day, it is automatically pruned from `weeklyHistory` to avoid cluttering navigation.

### 6.2. Weekly Badge Qualification Rules
- **7-Day Threshold**: To claim a weekly badge for a week, all required tasks across the full 7-day schedule must be met.
- **Cut-Short Weeks**:
  - If a week is cut short before 7 days, its badge is not auto-awarded in that partial historical slice.
  - However, because completions on overlapping days remain in `state.grid`, those days immediately count toward the new active week's badge requirement.
- **Legacy Grandfathering**: All historical weeks previously marked `weeklyClaimed: true` remain permanently unlocked and honored in the Badge Case and historical views.

---

## 7. Edge Cases & Decision Alignment

| Edge Case | Resolution |
| :--- | :--- |
| **Backward Start Day Shift** | If a parent on Wednesday shifts start day from Friday to Monday, dates strictly belong to the latest assigned week cycle. |
| **Rapid Start Day Switching** | Intermediate zero-completion micro-entries are discarded; only meaningful active intervals remain in history. |
| **Star Vault Integrity** | Star Vault earnings are keyed by absolute `YYYY-MM-DD` and are completely decoupled from week boundaries, ensuring 100% star calculation fidelity. |
| **Task Lifecycle (Soft Delete)** | Historical weeks continue to respect `task.createdAt` and `task.deletedAt` bounds alongside week boundary cutoffs. |

---

## 8. MoSCoW Implementation Plan

### Must Have
- [ ] `getHistoricalWeekIntervals()` helper in `date_utils.js` / `app.js` to compute dynamic week bounds and superseded date sets.
- [ ] Update `renderGridTable()` to use viewing week's `weekStartDay` instead of global `state.weekStartDay`.
- [ ] Superseded day styling in `style.css` (diagonal hatch pattern, disabled state, tooltips).
- [ ] Interval-based paging in `#prev-week-btn` and `#next-week-btn`.
- [ ] Header date range formatting reflecting actual active date spans.
- [ ] Admin week start day switch logic to archive partial slice and prune micro-weeks.
- [ ] Automated regression tests in `tests.js` covering all dynamic boundary, paging, and rendering scenarios.

### Should Have
- [ ] Visual indicator badge in header for partial weeks (e.g., `"• Partial Week"` tag).

### Won't Have (Deferred)
- [ ] Retroactive editing of historical weeks.
