# Product Requirement Document (PRD): Generic Alternating Activity Pairs Engine & Dynamic Schedule Swapping

**Document**: `docs/prd_alternating_activity_pairs.md`  
**Version**: 1.0.0  
**Phase**: Phase 2 (Future Phase)  
**Status**: Approved Specification for Future Implementation  
**Audience**: Product Management, UX Design, Game Design, Engineering, Parent Administrators  
**Companion Standards**: [`docs/prd_rest_day_passes_and_bonus_tasks.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_rest_day_passes_and_bonus_tasks.md), [`docs/prd_column_state_machine.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_column_state_machine.md)  

---

## 1. Executive Summary & Problem Statement

### 1.1. Context & Motivation
Children often have more total subjects than bandwidth allows in a single day (e.g., 5 total subjects, but a daily capacity of 4). In Phase 1, parents manage this manually using Rest Day Passes.

In **Phase 2**, we automate this recurring scheduling by introducing the **Generic Alternating Activity Pairs Engine**:
* Allows parents to pair *any two activities* (e.g. Reading $\leftrightarrow$ Writing for Kepler, Art $\leftrightarrow$ Science for Lyra).
* Automatically assigns complementary active days across the week.
* Provides a **1-Click Cadence Swap** in Parent Admin when an unexpected rest day occurs, rippling the on-off pattern through Sunday without child friction.

---

## 2. Technical Data Architecture (Schema V19)

### 2.1. State Schema (`state.js`)
```javascript
{
  schemaVersion: 19,
  // Existing tasks list
  tasks: [
    { id: 'piano', name: 'Piano Practice', emoji: '🎹', active: true },
    { id: 'math', name: 'Math Practice', emoji: '🧮', active: true },
    { id: 'chinese', name: 'Chinese', emoji: '💮', active: true },
    { id: 'reading', name: 'Reading Time', emoji: '📚', active: true },
    { id: 'writing', name: 'Writing', emoji: '✏️', active: true }
  ],

  // Generic Alternating Pairs List
  alternatingPairs: [
    {
      id: 'pair_literacy',
      title: 'Language Arts',
      taskA: 'reading',          // Primary Task (Default days)
      taskB: 'writing',          // Secondary Task (Assigned days)
      taskBDays: [2, 4, 6],      // Days of week (0=Sun, 1=Mon, 2=Tue...) where Task B is due
      allowBonusOnRestDays: true // Completing the off-task gives +10 XP bonus
    }
  ],

  // Date-Keyed Swaps (Pruned automatically on weekly rollover)
  cadenceOverrides: {
    // "YYYY-MM-DD": taskId
    "2026-09-04": "writing",
    "2026-09-05": "reading",
    "2026-09-06": "writing"
  }
}
```

### 2.2. Pure Functional Resolution Helper
```javascript
export function getTaskDailyStatus(state, taskId, dateStr) {
  const pair = (state.alternatingPairs || []).find(
    p => p.taskA === taskId || p.taskB === taskId
  );

  if (!pair) {
    return { isRequired: true, isOptionalBonus: false, pairId: null };
  }

  if (state.cadenceOverrides && state.cadenceOverrides[dateStr]) {
    const activeTaskId = state.cadenceOverrides[dateStr];
    const isThisTaskActive = (activeTaskId === taskId);
    return {
      isRequired: isThisTaskActive,
      isOptionalBonus: !isThisTaskActive && !!pair.allowBonusOnRestDays,
      pairId: pair.id
    };
  }

  const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
  const isTaskBDue = (pair.taskBDays || []).includes(dayOfWeek);
  const activeTaskId = isTaskBDue ? pair.taskB : pair.taskA;
  const isThisTaskActive = (activeTaskId === taskId);

  return {
    isRequired: isThisTaskActive,
    isOptionalBonus: !isThisTaskActive && !!pair.allowBonusOnRestDays,
    pairId: pair.id
  };
}
```

---

## 3. Parent Admin Panel UI

Located inside the Admin Modal under **Activity Management**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔗 ALTERNATING ACTIVITY PAIRS                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 📚 Reading Time  ⇄  ✏️ Writing                           [ 🗑️ Unlink ] │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ 1. Active Days for ✏️ Writing:                                          │ │
│ │    [ Su ]  [ M ]  [🔵 Tu]  [ W ]  [🔵 Th]  [ F ]  [🔵 Sa]                 │ │
│ │                                                                         │ │
│ │    🗓️ Schedule Summary (Live Mirroring):                                │ │
│ │    • ✏️ Writing:      3 Days (Tue, Thu, Sat)                            │ │
│ │    • 📚 Reading Time: 4 Days (Sun, Mon, Wed, Fri) ── Auto-Assigned ✨    │ │
│ │                                                                         │ │
│ │ 2. Overachiever Bonus:                                                  │ │
│ │    [✓] Allow child to earn +10 Bonus XP for completing the off-task    │ │
│ │                                                                         │ │
│ │ 3. Current Week Quick Swap:                                             │ │
│ │    [ 🔄 Swap Cadence from Today (Friday) Through Sunday ]               │ │
│ │    [ ↺ Reset to Baseline ]                                              │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ [ ➕ Pair Two Activities to Alternate ]                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Engineering Invariants & Safety

1. **Diagnostic Validation**: `runStateDiagnostics()` evaluates daily completion using `getTaskDailyStatus()`, verifying only `isRequired` tasks.
2. **Weekly Goal Math**: `getTaskRequiredDays(taskId)` dynamically tallies days where the task is `isRequired && !isExcused`.
3. **Historical Isolation**: Archived weeks snapshot `alternatingPairs` into `weeklyHistory[weekStartDate]`.
4. **Cloud Pruning**: `resetWeekGrid()` removes stale `cadenceOverrides` entries.
5. **Unlinking Behavior**: Tapping `[ 🗑️ Unlink ]` removes the pair; both tasks immediately revert to standalone daily requirements (`isRequired = true` every day).
6. **Child Schedule Shift Banner**: When a parent executes a mid-week cadence swap, the tracker screen renders a friendly banner on the active day: *"Friday Mission: Writing Day! ✏️"* to eliminate child surprise.
