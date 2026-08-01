# Implementation Plan: Historical Week Archive & Restoration (V15)

This document outlines the step-by-step technical plan to implement the approved PRD for Historical Weeks.

---

## Phase 1: State Schema Updates & Migration (V15)

### 1.1. Schema Changes (`state.js`)
- Increment `state.version` to `15`.
- Add `weeklyHistory` object to default template:
  ```javascript
  weeklyHistory: {} // Key: YYYY-MM-DD (weekStartDate), Value: { weekStartDay, reward, megaReward, weeklyClaimed, badgeId, xpEarned }
  ```
- Update `state.tasks` array items to include lifecycle fields:
  ```javascript
  {
    id: 'piano',
    name: 'Piano Practice',
    emoji: '🎹',
    concept: 'Level up!',
    instructions: '...',
    active: true,
    createdAt: '2026-07-10', // Default to a reasonable past date for existing tasks
    deletedAt: null
  }
  ```

### 1.2. Migration Logic (`migrations.js` / `state.js`)
- Implement a migration function `migrateToV15(oldState)`:
  - Detect if state version is `< 15`.
  - For the active week, map all `state.grid` keys matching `${dayIndex}-${taskId}` to `${date}-${taskId}` using the current `state.weekStartDate` and `state.weekStartDay` to calculate the absolute date of each column.
  - Do the same for `state.excused`.
  - Initialize lifecycle fields for default tasks (`active: true`, `createdAt: "2026-07-01"`).
  - Save the migrated state.
- **Seeding Hook**: Add a placeholder hook in the migration script where we can inject the JSON payload of historical completions provided by the parent for Kepler and Lyra.

---

## Phase 2: Refactor JS Grid Logic to use Date Keys

### 2.1. Date Resolution Refactoring
- Update `app.js` and `vault.js` to read and write grid/excused status using absolute date keys instead of day indexes.
- Functions to update:
  - `checkDayCompleted` (in `vault.js`): Should write to `state.starVault.earnedDates` directly based on date check.
  - `syncVaultStarsWithGrid` (in `app.js`): Resolve dates for each day index and check completions.
  - Task toggle event listeners (in `app.js`): Map cell clicks to `YYYY-MM-DD-taskId` keys.
  - Exception toggle event listeners (in `app.js`): Map exception cells to `YYYY-MM-DD-taskId` keys in `state.excused`.

---

## Phase 3: Paging UI Implementation

### 3.1. Main Grid Header Updates (`index.html` & `style.css`)
- Replace the static weekly header with a paging container:
  - `[ <- Prev ] [ Week Date Range Display ] [ Next -> ]`
  - Style buttons to fit the pixel art theme.
- Add dynamic week range display text (e.g., "Jul 27 - Aug 2, 2026").

### 3.2. Navigation Logic (`app.js`)
- Maintain a `currentViewingWeekStartDate` variable in memory (defaults to `state.weekStartDate`).
- On `Prev` click: Subtract 7 days from `currentViewingWeekStartDate` and call `renderState(true)`.
- On `Next` click: Add 7 days to `currentViewingWeekStartDate` and call `renderState(true)`.
- Disable `Next` button if `currentViewingWeekStartDate >= state.weekStartDate` (cannot page into future).
- Render grid cells by looking up `${resolvedDate}-${taskId}` in `state.grid`.
- **Lock UI**: If `currentViewingWeekStartDate < state.weekStartDate` (historical week), disable all click event listeners on grid cells (Read-only mode).
- Render the weekly badge section:
  - If viewing current week: show silhouette or active badge.
  - If viewing past week: look up `state.weeklyHistory[viewingStartDate]`. If claimed, show the full-color earned badge image (using `badgeId` from history) and hide the "Claim" button.

---

## Phase 4: Soft-Deletion Task Logic & Admin Panel Updates

### 4.1. Admin Panel Task Deletion
- Update the "Delete Task" action in the Admin Panel:
  - Instead of removing the task from `state.tasks`, set `active = false` and `deletedAt = formatLocalDate(new Date())`.
- Update the "Add Task" action:
  - Set `createdAt = formatLocalDate(new Date())`, `active = true`, `deletedAt = null`.
  - Re-activate existing task if the ID is re-added.

### 4.2. Grid Rendering Filters
- Update `renderState` (specifically `buildGridHeaders` and task row rendering):
  - When rendering week starting `W_START` to `W_END`:
    - For each task in `state.tasks`:
      - Check if active during that week (created before `W_END` and not deleted before `W_START`).
      - If not active, do not render the row.
      - If active but created mid-week, grey out/disable cells for days prior to `createdAt`.
      - If active but deleted mid-week, grey out/disable cells for days post `deletedAt`.

---

## Phase 5: Verification & Testing

### 5.1. Automated Tests (`tests.js`)
- Add Test Case 32: Grid Migration (V14 -> V15).
- Add Test Case 33: Historical Paging (assert cells are read-only, badge/rewards metadata is loaded correctly).
- Add Test Case 34: Task lifecycle rendering (greyed out cells prior to add / post deletion).
- Run headless test suite to verify.
