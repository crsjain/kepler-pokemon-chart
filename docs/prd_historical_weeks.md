# Product Requirement Document (PRD): Historical Week Archive & Restoration

**Status:** Approved / Ready for Implementation
**Author:** Jetski & crsjain
**Last Updated:** 2026-07-29

---

## 1. Executive Summary
The Pokémon Training Chart currently only maintains the state of the *current* week. When the week resets, past completion data is cleared, making it difficult to recover from sync errors, track long-term progress, or verify past activity. Additionally, the Star Vault relies on a fragile date-calculation method that can easily get out of sync.

This feature introduces a **Calendar-Date Keyed Grid** and a **Weekly History Archive**. By mapping task completions directly to real calendar dates (e.g., `2026-07-27-piano`) rather than relative day indexes (e.g., `0-piano`), we enable natural history tracking, robust paging through past weeks, and accurate star/streak calculations.

---

## 2. Motivation / User Problem
1.  **Fragile Recovery**: If a bug or sync issue clears the local state, there is no record of past weeks' completions to restore from, leading to frustration.
2.  **No Progress Visibility**: Kepler cannot see his past weeks' achievements or look back at the badges he earned in context of the weeks he completed.
3.  **Star Date Drift**: Star Vault dates are calculated relative to the current week's start date when synced, which can drift if the app is not opened regularly or if the week start day is changed.
4.  **Task Pool Changes**: Adding or removing tasks mid-week or between weeks messes up the relative grid layout, as there is no record of which tasks were active on which days.

---

## 3. Goals
-   Maintain a permanent, queryable record of daily task completions.
-   Allow users to page backward and forward through historical weeks via the main UI.
-   Render past weeks accurately, showing only tasks that were active during that week, and greying out days/tasks that were not yet added or were already removed.
-   Ensure changing the `weekStartDay` does not corrupt historical completion data.
-   Fix Star Vault date calculation by linking stars directly to the calendar-keyed grid completion.

---

## 4. Non-Goals
-   Providing a full-blown analytics dashboard (simple paging is enough for now).
-   Allowing children to edit past weeks (parent-gate requirements for history edits are open for discussion).
-   Supporting indefinite history if it exceeds Firestore limits (we must define a reasonable cap or verify storage scalability).

---

## 5. Proposed Technical Design & Schema Changes

### 5.1. Calendar-Date Keyed Grid
Currently, `state.grid` keys are format `dayIndex-taskId` (e.g., `0-piano`).
We will transition to `YYYY-MM-DD-taskId` keys.

*Example:*
```javascript
state.grid = {
  // Current Week completions
  "2026-07-27-piano": true,
  "2026-07-27-math": true,
  // Past Week completions (preserved!)
  "2026-07-20-piano": true,
  "2026-07-21-piano": true
};
state.excused = {
  "2026-07-27-chinese": true // Exceptions also keyed by date
};
```

### 5.2. Task Lifecycle Metadata (Soft Deletion)
To handle tasks being added or removed, we cannot simply delete them from `state.tasks`. We must introduce lifecycle metadata:

```javascript
state.tasks = [
  {
    id: 'piano',
    name: 'Piano Practice',
    emoji: '🎹',
    active: true,
    createdAt: '2026-07-10', // Date task was introduced
    deletedAt: null          // Date task was removed (if applicable)
  }
];
```

*Rendering Logic for Week of `W_START` to `W_END`:*
-   A task is **visible** in the grid if:
    -   It was created before or during this week (`createdAt <= W_END`).
    -   AND it was not deleted before this week (`deletedAt === null` or `deletedAt >= W_START`).
-   A cell is **greyed out (disabled)** if:
    -   The specific day date is before `createdAt` (prior to add).
    -   Or the specific day date is after `deletedAt` (post removal).

### 5.3. Weekly History Archive
To track rewards and badges earned in past weeks, we introduce `state.weeklyHistory`:

```javascript
state.weeklyHistory = {
  "2026-07-20": { // Key is the weekStartDate string
    weekStartDay: 1, // Start day at that time (e.g., Monday)
    reward: "Bonus Tablet Time",
    megaReward: "Card Pack",
    weeklyClaimed: true,
    badgeId: 152, // Chikorita badge earned
    xpEarned: 150
  }
};
```

---

## 6. E2E Critical User Journeys (CUJs)

### CUJ 1: Paging through History
1.  Kepler opens the app. The grid shows the current week (e.g., "Mon, Jul 27 - Sun, Aug 2").
2.  Kepler clicks the `<- Prev` button in the header.
3.  The grid transitions to show the week of "Mon, Jul 20 - Sun, Jul 26".
4.  The cells show the completions as they were recorded. The header shows the reward ("Bonus Tablet Time") and the badge earned that week (revealed, not a silhouette).
5.  All cells in the past week are read-only (or locked behind Parent Gate).
6.  Kepler clicks `Next ->` to return to the current week.

### CUJ 2: Handling Task Deletion mid-week
1.  On Wednesday, Parent decides to remove "Piano Practice".
2.  In Admin Panel, Parent deletes "Piano Practice". The task is marked `active = false` and `deletedAt = '2026-07-29'`.
3.  On the current week's grid:
    -   Monday and Tuesday (before deletion) show "Piano" with whatever completion status they had.
    -   Wednesday onwards shows "Piano" as greyed out / un-completable.
4.  Next week, "Piano" does not show up at all in the active grid because `deletedAt` is in the past relative to the new week.
5.  Paging back to last week shows "Piano" fully active and editable (for that historical context).

---

## 7. Decisions & Alignment (Grill-Me Outcomes)

### 📌 Decision 1: Read-Only History
-   **Alignment**: Historical weeks are strictly **Read-Only**.
-   **Rationale**: Prevents complex retroactive synchronization bugs, double-claiming of rewards, and recalculation cascades for stars/badges.
-   **Implementation**: Clicking on cells in any week prior to the current week will be disabled in the UI.

### 📌 Decision 2: Migration & Seeding
-   **Alignment**: Automatically migrate the active week's grid data using `state.weekStartDate`.
-   **Seeding**: The user (parent) will provide static historical grid details for the 2 existing users (Kepler and Lyra) in a JSON format during the deployment phase to seed their history.
-   **Old History**: Pre-existing Star Vault dates remain intact as they are already stored as absolute dates, but daily grid details for weeks before the update will not be reconstructed.

### 📌 Decision 3: Inline Storage (Firestore Limits)
-   **Alignment**: Keep history stored inline in the profile state for now.
-   **Rationale**: Est. ~54KB/year storage growth is well within Firestore's 1MB document limit, allowing 10+ years of operation before needing separate collections. Keeps backup/restore simple and unified.

### 📌 Decision 4: Changing `weekStartDay` Mid-Week
-   **Alignment**: Do **NOT** clear the grid on start day change.
-   **Rationale**: Since completions are keyed by real calendar dates, shifting `state.weekStartDate` simply changes the rendering window. Completions that still fall within the new window remain visible, and others are preserved in history.

---

## 8. MVP Requirements (MoSCoW)
-   **Must Have**:
    -   Migration of grid to `YYYY-MM-DD-taskId` keys.
    -   Paging UI (Prev/Next buttons) on main grid.
    -   Soft-deletion metadata for tasks (`createdAt`, `deletedAt`, `active`).
    -   Greyed out rendering for inactive tasks/days (prior to add / post removal).
    -   `state.weeklyHistory` to track past rewards/badges.
-   **Should Have**:
    -   Tooltips on historical week header showing the reward earned.
-   **Could Have**:
    -   None.
-   **Won't Have**:
    -   Any editing of historical weeks (Locked/Read-Only).
    -   Visual progress graphs/charts (visual paging only).
