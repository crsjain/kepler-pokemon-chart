# Product Requirement Document (PRD): Adaptive Week Scheduling, Modal Design System & Visual Grid State Specification (v3.0)

**Status:** Approved & Implemented  
**Author:** crsjain & Jetski  
**Last Updated:** 2026-08-16  
**Version:** 3.0 (Adaptive Scheduling, Schedule Summary Hero Cards, Grid Visual Hierarchy & Multi-Adjustment Consolidation)

---

## 1. Executive Summary

The Pokémon Training Chart tracks daily habits, weekly rewards, badges, and partner evolution progress for Kepler and Lyra. 

In early versions of the application, week scheduling was locked to rigid 7-day arithmetic (`±7 days`) with a fixed global start day. Changing the start day mid-week corrupted past training history, broke calendar navigation, and lacked clear communication for parents and children.

**v3.0 establishes an authoritative Adaptive Scheduling & Visual Hierarchy System**:
1. **2-Phase Shift Model**: Distinguishes between **Future Mid-Cycle Shifts** (forward-hatching, non-destructive, and reversible before arrival) and **Past/Today Shifts** (immediate archiving with historical fidelity).
2. **Schedule Summary Hero Card System**: A unified, high-contrast modal design language eliminating visual fragmentation across all confirmation dialogs.
3. **Visual Grid State Hierarchy**: Strict visual styling and interaction rules for Active, Past, Future, and Superseded/Hatched days (covering regular Pokéballs, Excused Bonus Balls, and Daily Totals).
4. **Parent Voice & Copy Standards**: Crystal-clear, jargon-free microcopy with guaranteed line-break protection and full day names.
5. **Smart History Consolidation**: Automatic merging of rapid start-day adjustments to prevent timeline fragmentation.

---

## 2. Motivation & User Problem Statement

1. **Destructive Start-Day Changes**: Parents adjusting the start day from Monday to Friday on Wednesday lost their visual context or saw past weeks rendered under the wrong day of the week.
2. **Unclear Schedule Shifts**: When changing a schedule, parents need immediate clarity: *When does the current chart end? When does the new chart start? Can I undo this if I made a mistake?*
3. **Modal Fragmentation**: Early modals used inconsistent layouts, unaligned badge chips, and awkward hyphen line-breaks (e.g. `(Aug 12 - \n 18, 2026)?`).
4. **Visual Ambiguity in the Grid**: Children and parents need instant visual cues to distinguish today's tasks from past records, future locked days, and days that moved to a new chart.
5. **Dropdown Sizing & Alignment**: Settings rows in Parent Admin previously had uneven widths and text clipping (e.g., `"Wednesday"` cut off).

---

## 3. The 2-Phase Week Shift Model

When a parent alters the **Week Start Day** in Parent Admin (`adminWeekStartSelect`), the system dynamically evaluates the target day relative to the active week:

```
                  CURRENT ACTIVE WEEK (Mon Aug 10 – Sun Aug 16)
                                Today = Wednesday Aug 12
 ─────────────────────────────────────────────────────────────────────────────
  PAST / TODAY in Cycle (Mon, Tue, Wed)      FUTURE in Cycle (Thu, Fri, Sat, Sun)
  ─────────────────────────────────────      ────────────────────────────────────
  Case B: Immediate Shift & Archive          Case A: Future Mid-Cycle Shift
  • Prompts for Permanent Change             • Prompts for Future Shift Notice
  • Archives Mon-Tue slice to history        • Sets pendingWeekStartDate (Aug 14)
  • Instantly starts new chart               • Forward-hashes Fri-Sun on active chart
  • Cannot be undone (History locked)        • 100% Reversible before Friday arrives
```

### 3.1. Case A: Future Mid-Cycle Shift (e.g. Selecting Friday on Wednesday)
*   **Behavior**: The active week is scheduled to end early (Thursday night). Friday through Sunday move forward to anchor the new Friday chart.
*   **State Updates**:
    *   `state.pendingWeekStartDay = 5` (Friday)
    *   `state.pendingWeekStartDate = "2026-08-14"` (Target Friday date)
    *   `state.weekStartDay` and `state.weekStartDate` remain on Monday Aug 10 until rollover.
*   **Grid Rendering**:
    *   **Mon–Thu**: Remain 100% active, editable, and highlighted.
    *   **Fri–Sun**: Immediately receive diagonal hatched styling (`.superseded-cell`, `.superseded-header`), disabled checkboxes, and hover tooltips.
    *   **Header Banner**: Displays shortened span: `Aug 10 - 13, 2026 • 4 Days (Start Day Adjusted 📅)`.
*   **Parent Admin & Reversibility**:
    *   Dropdown persists selection on **Friday**.
    *   Shows blue status pill: `📅 Shift Scheduled (Friday) • Current chart ends Thursday...`
    *   Provides two intuitive ways to revert:
        1. Click the one-touch **`[ ↩️ Revert to Monday ]`** button inside the status pill.
        2. Select **Monday** from the dropdown.
    *   Reverting immediately deletes `pendingWeekStartDate`, un-hashes Fri–Sun, and restores the full 7-day week with zero data loss.
*   **Rollover**: When Thursday tasks are complete and the parent clicks **Reset Week Grid**, the 4-day slice is archived into `weeklyHistory` and the new 7-day Friday chart (`Aug 14 – 20`) is initialized.

### 3.2. Case B: Immediate Shift & History Archival (e.g. Selecting Wednesday on Wednesday)
*   **Behavior**: Immediately locks and archives the current week slice into `weeklyHistory` and initializes a fresh active week starting on the selected day.
*   **Smart History Consolidation**:
    *   If multiple shifts occur within the same 7-day window, the system consolidates completions under the primary week anchor rather than fragmenting history into 1-day micro-entries.
*   **Permanent Notice**: Prompts the parent with a warning callout explaining that past history will be saved and cannot be edited.

---

## 4. Visual Grid State Hierarchy & Interaction Invariants

The 7-column weekly grid adheres to a strict visual and interaction state machine:

| Column State | Header Styling | Cell Styling | Pokéball & Bonus Ball Styling | Pointer & Click Rules | Hover Tooltip |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Active Day** (Today / Selected) | Bright Pokémon Yellow (`#ffcb05`, `.active-day`) | Active column highlight (`.active-column`) | Full color / interactive (`.pokeball`) | Fully interactive (click to check/uncheck) | None |
| **Past Day (Current Week)** | Standard blue header | Standard cell opacity (1.0) | Standard interactive Pokéball | Interactive (allows catch-up completions) | None |
| **Past Week (History Mode)** | Muted slate header (`#cbd5e1`, `.past-week-header`) | Read-only cells (`.past-week-cell`) | Display recorded state (checks/stars) | `pointer-events: none` (strictly read-only) | None |
| **Future Day (Locked)** | Standard header (`.future-day-header`) with `cursor: not-allowed` | Future locked background (`#f1f5f9`, `.future-cell`) | Muted opacity (0.7), disabled `<input>` | Header click & cell click blocked (no modals) | None |
| **Superseded / Forward-Hashed** | Slate gradient diagonal hatch (`.superseded-header`) | Light diagonal hatch (`#f8fafc` / `#e2e8f0`, `.superseded-cell`) | Grayscale (100%), opacity (0.25), transparent inner circle on Bonus Balls | `cursor: not-allowed`, clicks blocked, `pointer-events: auto` for hover | `"These days moved to your new chart! 🚀"` |

### 4.1. Bonus Ball (Excused Task) Hatching Rule
*   Bonus Balls (`.checkbox-cell.excused-cell`) use transparent backgrounds when located on superseded days (`.checkbox-cell.superseded-cell.excused-cell`), allowing the diagonal hatch stripes to flow seamlessly through the star icon (`★`) and `+XP` badge.

---

## 5. Modal Design System: Schedule Summary Hero Card

All confirmation and decision dialogs across the application use the unified **Schedule Summary Hero Card** layout (`.schedule-hero-card`), ensuring high visual hierarchy, clean contrast, and parent-friendly copy.

### 5.1. Component Anatomy
```
┌────────────────────────────────────────────────────────┐
│ [MODAL TITLE] 📅                                       │
├────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐ │
│ │ 🗓️ HERO LABEL (UPCOMING SCHEDULE / NEW SCHEDULE)   │ │
│ │ Starts Wednesday • Aug 12 – 18, 2026               │ │  <-- Hero Card
│ │ Context explanation in warm, friendly tone.        │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ℹ️ INFO OR ⚠️ WARNING CALLOUT                       │ │  <-- Callout Box
│ │ Actionable notice regarding reversibility/effects. │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ [ Confirm Button (Green / Blue) ]   [ Cancel Button ]  │
└────────────────────────────────────────────────────────┘
```

### 5.2. Standardized Modals Across Application
1.  **Future Start Day Shift (Case A)**:
    *   Hero: `🗓️ UPCOMING SCHEDULE • Starts Friday • 2026-08-14`
    *   Callout: `ℹ️ Schedule Notice: You can modify or revert this schedule anytime in Parent Admin before Friday.`
2.  **Immediate Start Day Shift (Case B)**:
    *   Hero: `🗓️ NEW SCHEDULE • Starts Wednesday • Aug 12 – 18, 2026`
    *   Callout: `⚠️ Permanent Schedule Change: Applying this change will save your current chart to history.`
3.  **Reset Week Grid**:
    *   Hero: `🔄 RESET TRAINING GRID • Aug 17 – 23, 2026`
    *   Callout: `ℹ️ Progress Preservation: Unclaimed badges or stars will be archived safely.`
4.  **Mega Milestone Rollover**:
    *   Hero: `👑 MEGA MILESTONE • 4 Weeks Completed!`
    *   Callout: `🎉 Mega Reward Ready to Claim!`
5.  **Switch Active Day**:
    *   Hero: `📅 SWITCH ACTIVE DAY • Wednesday`
    *   Sub: `Switch active column highlight to Wednesday?`
6.  **Delete Profile**:
    *   Hero: `🗑️ DELETE TRAINER PROFILE • [Trainer Name]` (`.schedule-hero-card.danger`)
    *   Callout: `⚠️ Permanent Action: All badges, levels, and training history will be deleted.`

---

## 6. Copy, Typography & Formatting Standards

1. **No Internal Jargon**: Never use terms like `"Active Cycle"`, `"Temporal Anchor"`, or `"Slice Offset"` in user-facing UI. Use `"New Week"`, `"Upcoming Schedule"`, and `"Training Chart"`.
2. **Line-Break Protection**:
   * All dates, ranges, and compound labels must be wrapped with `<span style="white-space: nowrap;">` (or CSS `white-space: nowrap`) to prevent awkward orphan breaks like `(Aug 12 - \n 18, 2026)`.
3. **Full Day Names in Dropdowns**:
   * Dropdown menus display full day names (`Monday`, `Tuesday`, `Wednesday`, etc.).
   * Dropdown inputs are sized to a uniform `140px` with `box-sizing: border-box`.
4. **Parent Admin Settings Layout**:
   * Desktop `.admin-grid` first column is sized to `320px` to guarantee all settings labels (`Week Start:`, `App Timezone:`, `Screensaver:`) remain on a single line and achieve pixel-perfect right alignment with dropdowns.

---

## 7. Data Architecture & Historical Resolution

### 7.1. Dynamic Boundary Resolution Algorithm (`getHistoricalWeekIntervals`)
Historical week intervals are resolved chronologically at runtime from `state.weeklyHistory` and `state.weekStartDate`:
1.  **Interval Sequence**: Sorted array of recorded start dates: $[K_0, K_1, ..., K_{\text{current}}]$.
2.  **Nominal vs Actual End Date**:
    *   $\text{nominalEnd} = \text{start} + 6\text{ days}$.
    *   $\text{actualEnd} = \min(\text{nominalEnd}, K_{i+1} - 1\text{ day})$.
    *   If $\text{actualEnd} < \text{nominalEnd}$, dates between $\text{actualEnd} + 1$ and $\text{nominalEnd}$ are flagged as `supersededDates`.
3.  **Navigation Paging**: `#prev-week-btn` and `#next-week-btn` step sequentially through this interval array, eliminating math errors from start-day changes.

### 7.2. Gamification Safeguards
*   **Mega Milestone Accumulator (`state.megaWeeks`)**: Non-consecutive 4-badge accumulator. Preserved on cut-short weeks; increments only when full 7-day weeks are claimed.
*   **Star Vault Decoupling**: Stars are earned per calendar date (`YYYY-MM-DD`) and remain 100% intact regardless of week adjustments.
*   **Day-of-Week Exception Mapping**: Exceptions carry forward by weekday name (`Monday` $\rightarrow$ `Monday`), preserving parent intent across shifted charts.

---

## 8. Verification & Test Matrix

The test suite in [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js) enforces 100% compliance across **65 automated test cases**, complemented by 13 manual scenarios in [`docs/verification_guide.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/verification_guide.md):

*   **Test Case 29**: Dropdown bounding-box right-alignment geometry and label wrapping.
*   **Test Case 33**: Future Day Locking & Sandbox override modes.
*   **Test Case 58–60**: Dynamic boundary computation, partial week rendering, and superseded Bonus Ball hatch styling.
*   **Test Case 61–63**: Smart transition archiving, milestone preservation, and exception mapping.
*   **Test Case 64**: History consolidation across rapid multi-adjustments.
*   **Test Case 65**: Complete Case A Future Shift lifecycle (Schedule Notice modal, forward-hatching, click blocking, reversibility, and rollover).
