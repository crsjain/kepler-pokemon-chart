# CHECKPOINT 22

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this document to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests
- [x] Limit Historical Week Navigation (done)
- [x] Historical Day Header Treatments (done)
- [x] Forced Today Active Day (done)
- [x] Isolated Test Account (done)
- [x] Week Start Day Switch bug (done)
- [x] Future Day Locking (done)
- [x] Reward Selection UI Reset Bug: Fixed issue where selecting a reward immediately reset the UI dropdown to "Bonus Tablet Time" (done)

---

## 2. User & Project Metadata
*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Target Audience**: Kepler (7 years old) and Lyra (5 years old)
*   **Current Version**: `v1.7.1 (v57)` / Service Worker cache `v57`
*   **Active Port**: `8085` (running Python web server)
*   **Firebase Emulator Project**: `demo-pokemon-chart` (Firestore UI on port `4000`, DB on `8080`, Auth on `9099` - running in background)
*   **Parent Email**: `crsjain@gmail.com`
*   **Admin Password**: `zxcv`
*   **Git Policy**: Dev branch commits and pushes to origin. Merges to main to deploy.

---

## 3. Active V15 State Schema
```javascript
export let state = {
  version: 15,
  partnerFamily: '25', // Default Pikachu Family
  weekStartDay: 0, // Default Sunday (0) to Saturday (6)
  idleTimeout: 10, // Default 10 minutes
  weeklyRewardOptions: [...DEFAULT_WEEKLY_REWARDS],
  megaRewardOptions: [...DEFAULT_MEGA_REWARDS],
  excused: {}, // key format: "YYYY-MM-DD-task" -> boolean
  weeklyHistory: {}, // key format: "YYYY-MM-DD" -> { weekStartDay, reward, megaReward, weeklyClaimed, badgeId, xpEarned }
  partnersData: {
    '25': { level: 1, xp: 0, stageId: '25' },
    '4': { level: 1, xp: 0, stageId: '4' },
    '1': { level: 1, xp: 0, stageId: '1' },
    '7': { level: 1, xp: 0, stageId: '7' },
    '133': { level: 1, xp: 0, stageId: '133' }
  },
  reward: '',
  megaReward: '',
  megaWeeks: 0,
  weeklyClaimed: false,
  debugSidebarEnabled: false,
  grid: {}, // key format: "YYYY-MM-DD-task" -> boolean
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
  activeDay: new Date().getDay(),
  weekStartDate: formatLocalDate(getWeekStart(new Date(), 0)),
  starVault: {
    earnedDates: [],
    totalTraded: 0
  },
  collectedBadges: [],
  badgePool: TIER_1_IDS.filter(id => id !== 25),
  activeWeeklyBadgeId: 25
};
```

---

## 4. Work Accomplished
*   **Reward Selection UI Reset Fix**: Modified `renderRewardDropdowns()` in `app.js` to automatically restore `state.reward` and `state.megaReward` values to the UI dropdowns after they are repopulated. This prevents the UI from resetting to "Bonus Tablet Time" (the first option) immediately after a user selects a different reward.
*   **Removed Redundant UI Restores**: Cleaned up redundant value restoration logic in `editRewardsSaveBtn` click handler in `app.js` since `renderRewardDropdowns()` now handles this internally.
*   **Added Test Case 36**: Added a new regression test in `tests.js` to verify that both weekly and mega reward selections persist immediately after selection in the UI and survive state re-renders.

---

## 5. Files and Code
### Edited Files
*   [app.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js): Updated `renderRewardDropdowns` to restore values (lines 1476-1491) and removed redundant restore in `editRewardsSaveBtn` handler (lines 2004-2009).
*   [tests.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): Added **Test Case 36** for reward selection persistence (lines 2621-2658).

---

## 6. Validation Instructions

### Local Manual Verification
1. Launch the app locally: `http://127.0.0.1:8085/index.html`.
2. Select a weekly reward other than "Bonus Tablet Time" (e.g., "Choose Meal").
3. Verify that the dropdown selection stays on "Choose Meal" and does not jump back to "Bonus Tablet Time".
4. Select a mega reward other than "Booster Pack" (e.g., "Dessert Outing").
5. Verify that the mega dropdown selection stays on "Dessert Outing".
6. Check a task box to trigger a state save/render, and verify the dropdowns still show your selected rewards.
