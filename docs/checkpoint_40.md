# CHECKPOINT 40

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests & Implementation Record

- [x] **Phase 1: Rest Day Passes & Overachiever Bonus Tasks (`docs/prd_rest_day_passes_and_bonus_tasks.md`)**:
  - Implemented `💤 REST` Day Passes to excuse tasks during travel, illness, or fatigue, lowering the daily star threshold.
  - Implemented Overachiever Bonus Tasks: Excused cells remain interactive; checking an excused chore awards `+10 XP` to the active Pokémon partner and displays `5 / 4 ⭐ (Super Trainer! 🚀)`.
  - Preserved no-cheating invariant: Daily Star strictly requires all non-excused chores to be complete.
  - Accidental unchecking decrements 10 XP without revoking an already-earned Daily Star.
- [x] **Smart Hybrid Exception Mode (3-State Cycling & Smart Rollover)**:
  - **Exception Mode Cycling**: Parents tap a cell to cycle:
    $$\text{🔴 Required (Normal)} \longrightarrow \text{✨ BONUS (Elective)} \longrightarrow \text{💤 REST (Life Pass)} \longrightarrow \text{🔴 Required (Normal)}$$
  - **Visual Distinctness**:
    - `✨ BONUS`: Sky blue / cyan palette (`#38bdf8` border, `#0284c7` text, soft `#f0f9ff` background), `✨ BONUS` pill badge, `✓ BONUS` on check, `+10 XP` floating badge, tooltip `"Bonus Task (+10 XP if completed!)"`.
    - `💤 REST`: Lavender / indigo palette (`#a5b4fc` border, `#6366f1` text, diagonal stripe hatching background), `💤 REST` pill badge, `✓ REST` on check, `+10 XP` floating badge, tooltip `"Rest Day (+10 XP Bonus if completed!)"`.
  - **Smart Rollover Rule**:
    - `✨ BONUS` tasks automatically carry over by day-of-week on weekly rollover (permanent habit rules like weekend writing).
    - `💤 REST` passes automatically expire on weekly rollover (temporary life events).
    - Manual reset / rollover options (`carryOverExceptions = true`) continue to preserve both.
- [x] **PWA Cache & Export Surface Compatibility**:
  - Exported backwards-compatibility stubs in `state.js` (`applyBackup`, `saveAutoBackup`, `getBackupHistory`) to prevent stale PWA service worker deadlocks.
  - Bumped Service Worker cache to `poke-chart-cache-v108` and asset tags in `index.html` to `v=10.2`.
- [x] **Automated Test Suite**:
  - Updated Test 17 to test the full 3-state cycle in Exception Mode.
  - Added Test Case 68: Rest Day Passes & Overachiever Bonus verification.
  - Added Test Case 69: PWA Backward-Compatibility Export Contract verification.
  - Added Test Case 70: Child profile modal dismissal and validation state reset.
  - Added Test Case 71: Unearned weekly badge and reward carry-over on rollover.
  - Added Test Case 72: Smart Hybrid Exception Mode 3-state cycling, visual rendering, overachiever XP, and Smart Rollover auto-carryover / auto-expiration.
  - Verified 72/72 tests passing (100%) via `node run_headless_tests.js`.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Target Audience**: Kepler & Lyra (gamified training chart)
*   **Current Version**: `v1.10.0` / Service Worker cache `poke-chart-cache-v108` / Asset tag `v=10.2`
*   **Admin Password**: `"zxcv"`
*   **Local Server URL**: `http://localhost:8000/`
*   **Audio/Volume Settings**: Default volume 50%, synthesized 8-bit web audio chimes.

---

## 3. Active V18 State Schema

```javascript
{
  activePartnerInstanceId: '25',
  partnersData: {
    '25': { familyId: '25', level: 1, xp: 0, stageId: '25' },
    '4': { familyId: '4', level: 1, xp: 0, stageId: '4' },
    '1': { familyId: '1', level: 1, xp: 0, stageId: '1' },
    '7': { familyId: '7', level: 1, xp: 0, stageId: '7' },
    '133': { familyId: '133', level: 1, xp: 0, stageId: '133' },
    '95': { familyId: '95', level: 1, xp: 0, stageId: '95' }
  },
  reward: '',
  megaReward: '',
  megaWeeks: 0,
  weeklyClaimed: false,
  debugSidebarEnabled: false,
  grid: {}, // key format: "YYYY-MM-DD-task" -> boolean
  excused: {}, // key format: "YYYY-MM-DD-task" -> 'bonus' | 'rest' | boolean (legacy true = 'rest')
  tasks: [
    { id: 'piano', name: 'Piano Practice', emoji: '🎹', concept: 'Level up!', instructions: 'Play all pieces 3x and work on hard parts.', active: true, createdAt: '2026-07-01', deletedAt: null },
    { id: 'math', name: 'Math Practice', emoji: '🧮', concept: 'Intellect +1', instructions: "Complete today's worksheet or 15 mins on math app.", active: true, createdAt: '2026-07-01', deletedAt: null },
    { id: 'reading', name: 'Reading Time', emoji: '📚', concept: 'Explore new zones!', instructions: '15min reading out loud w/30s summary.', active: true, createdAt: '2026-07-01', deletedAt: null },
    { id: 'writing', name: 'Writing', emoji: '✏️', concept: 'Skill mastery', instructions: 'Write at least 3 clean sentences w/punctuation.', active: true, createdAt: '2026-07-01', deletedAt: null },
    { id: 'chinese', name: 'Chinese', emoji: '💮', concept: 'Character master!', instructions: 'Practice reading current vocabulary card set 2x.', active: true, createdAt: '2026-07-01', deletedAt: null }
  ],
  rewardHistory: [],
  megaRewardHistory: [],
  volume: 50,
  claimedRewardsHistory: [],
  activeDay: 1,
  weekStartDate: '2026-08-10',
  weekStartDay: 0,
  pendingWeekStartDate: null,
  pendingWeekStartDay: null,
  activeWeeklyBadgeId: 1,
  collectedBadges: [],
  starVault: {
    totalStars: 0,
    earnedDates: [] // Array of "YYYY-MM-DD"
  },
  adminPassword: "zxcv",
  profiles: {
    "kepler": { id: "kepler", name: "Kepler", role: "child" },
    "lyra": { id: "lyra", name: "Lyra", role: "child" }
  },
  activeProfileId: "kepler"
}
```

---

## 4. Architectural Invariants & Key Functions

1. **Excused Task Classification**:
   - `state.excused[key] === 'bonus'`: Scheduled Elective task.
   - `state.excused[key] === 'rest'` (or legacy `true`): Situational Rest Day pass.
   - `!state.excused[key]`: Normal required chore.
2. **Smart Rollover Helper (`carryOverExceptionsSmart`)**:
   - On rollover, entries with value `'bonus'` are mapped by day of week and automatically copied to the new week.
   - Entries with value `'rest'` or `true` only carry over if `carryOverExceptions === true`.
3. **No-Cheating Prerequisite**:
   - `isDayComplete(dateStr, state)` checks that every task not in `state.excused` has `state.grid[key] === true`.
4. **Partner XP Attribution**:
   - Completing an excused task awards `+10 XP` via `XP_BONUS_TASK`.
   - Completing a required task awards `+5 XP` via `XP_PER_TASK`.
   - Completing all required tasks triggers `CelebrationEngine` and awards `+10 XP` Daily Star bonus via `XP_DAILY_BONUS`.
