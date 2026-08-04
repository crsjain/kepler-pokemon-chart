# CHECKPOINT 24

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this document to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests
- [x] Limit Historical Week Navigation (done)
- [x] Historical Day Header Treatments (done)
- [x] Forced Today Active Day (done)
- [x] Isolated Test Account (done)
- [x] Week Start Day Switch bug (done)
- [x] Future Day Locking (done)
- [x] Reward Selection UI Reset Bug (done)
- [x] Partner Devolution (done)
- [x] Clean up and remove Parent Revert & Refund functionality (done)
- [x] Newly claimed partner persistence on reload (done)
- [x] Gamified "Old Week Alert" dialog popup on startup if date has advanced past grid week (done)
- [x] E2E Integration tests for startup alert (done)

---

## 2. User & Project Metadata
*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Target Audience**: Kepler (7-10 years old)
*   **Current Version**: `v1.7.1` / Service Worker cache `v65`
*   **Active Port**: `8085` (running Python web server)
*   **Firebase Emulator Project**: `demo-pokemon-chart`
*   **Parent Email**: `crsjain@gmail.com`
*   **Admin Password**: `zxcv`

---

## 3. Active V16 State Schema
```javascript
export let state = {
  version: 16,
  partnerFamily: '25', // Default Pikachu Family
  weekStartDay: 0, // Default Sunday (0) to Saturday (6)
  idleTimeout: 10,
  weeklyRewardOptions: [...DEFAULT_WEEKLY_REWARDS],
  megaRewardOptions: [...DEFAULT_MEGA_REWARDS],
  excused: {}, // key format: "YYYY-MM-DD-task" -> boolean
  weeklyHistory: {}, // key format: "YYYY-MM-DD" -> { weekStartDay, reward, megaReward, weeklyClaimed, badgeId, xpEarned }
  partnersData: {
    '25': { familyId: '25', level: 1, xp: 0, stageId: '25' },
    '4': { familyId: '4', level: 1, xp: 0, stageId: '4' },
    '1': { familyId: '1', level: 1, xp: 0, stageId: '1' },
    '7': { familyId: '7', level: 1, xp: 0, stageId: '7' },
    '133': { familyId: '133', level: 1, xp: 0, stageId: '133' }
  },
  reward: '',
  megaReward: '',
  megaWeeks: 0,
  weeklyClaimed: false,
  debugSidebarEnabled: false,
  grid: {}, // key format: "YYYY-MM-DD-task" -> boolean
  tasks: [...],
  rewardHistory: [],
  megaRewardHistory: [],
  volume: 50,
  claimedRewardsHistory: [],
  activeDay: new Date().getDay(),
  weekStartDate: 'YYYY-MM-DD',
  starVault: {
    earnedDates: [],
    totalTraded: 0
  },
  collectedBadges: [],
  badgePool: [...],
  activeWeeklyBadgeId: 25,
  activePartnerInstanceId: '25_timestamp',
  unlockedPartners: {
    '25_timestamp': { familyId: '25', level: 1, xp: 0, stageId: '25' }
  }
};
```

---

## 4. Work Accomplished
*   **Startup Alert for Advanced Week (Old Week Alert)**: Added logic to `app.js` upon profile first load that compares today's calendar week start date with the profile's active `weekStartDate`. If today is in a future week, a custom modal dialog pops up notifying the child that they are looking at last week's grid. The dialog uses gamified, child-friendly phrasing to encourage them to mark last week's completed tasks or scroll down to click "Reset Week Grid".
*   **E2E Headless Verification**: Wrote Test Case 45 in `tests.js` to assert the startup alert modal triggers properly, verifies the dialog's gamified text, and confirms the close button successfully dismisses the modal. Expose `selectProfile` test helper and enhanced `helpers.resetState` to automatically flush stale `.notif-modal` nodes to prevent E2E race condition flakiness.
*   **Revert & Refund Removal**: Completely deleted the "Revert & Refund" feature, removing the action button and reverting partner logic in `admin.js` and updating sections in `docs/prd_star_vault.md` to keep the application flow clean.
*   **Newly Unlocked Partner Reload Persistence**: Resolved a bug where refreshing the app reset the active partner back to Pikachu by updating `runStateDiagnostics()` in `state.js` to correctly validate dynamic partner instances via family mapping.
*   **Surface Optimizations**: Followed UX rules by ensuring that modal bodies use scrollable classes (`max-height` constraints with `overflow-y: auto`) instead of inline heights so that action buttons are accessible on smaller devices (like mobile landscape views).

---

## 5. Files and Code
### Edited Files
*   [app.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js): Implemented the startup week check in `subscribeToProfileState` (lines 654-670) and exposed `selectProfile` in test helpers (line 2773).
*   [tests.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): Added Test Case 45 (lines 3051-3114) and added async startup synchronization polling at the end of the file.
*   [service-worker.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): Bumped cache to `v65` to clear client browser caches.

---

## 6. Validation Instructions

### Headless Verification
Run the regression test suite to verify that all 45 test cases pass successfully:
```bash
node run_headless_tests.js
```

### Manual Verification
1. Open the application: `http://127.0.0.1:8085/index.html?useEmulator=true`.
2. Select a child profile.
3. In the Firestore emulator, manually edit the profile's `weekStartDate` to a date in the past (e.g. `'2026-07-27'`).
4. Refresh the page or switch profiles back and forth.
5. Verify that a custom modal dialog appears with the title: **New Week Training! 📅** and instructing you to complete last week's tasks or reset the grid.
6. Click **Awesome!** to close it.
