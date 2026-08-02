# CHECKPOINT 21

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this document to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests
- [x] Limit Historical Week Navigation: Prev Week button disables when viewing earliest week with data (Jun 29 - Jul 5, 2026 for Kepler) (done)
- [x] Historical Day Header Treatments: Greyed out background, muted slate text, `not-allowed` cursor, and click/toggle prevention in historical weeks (done)
- [x] Forced Today Active Day: Startup auto-aligns Kepler's active training day to today's date (done)
- [x] Isolated Test Account: Modified test runs to execute under `test_integration_user@gmail.com` to prevent personal profile overwrite (done)
- [x] Week Start Day Switch bug: Reset `currentViewingWeekStartDate` to `null` on start day changes in Admin panel to prevent past-week locking regressions (done)
- [x] Future Day Locking: Prevent checking off days in the future relative to today's date in production, while permitting developer bypasses in local emulator mode and test runs (done)

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
*   **Historical Navigation Bounds**: Integrated `getEarliestDataWeekStartDate()` to check `weeklyHistory`, `earnedDates`, and `claimedRewardsHistory` to resolve the earliest week with data, locking the `#prev-week-btn` once matched.
*   **Disabled Historical Day Headers**: Added `.past-week-header` classes to day headers in historical weeks to display a neutral gray background (`#cbd5e1`), muted slate text (`#64748b`), and cursor `not-allowed`. Blocked active day switching by returning early in the click handler for past weeks.
*   **Forced Startup Active Day**: Automatically resolves today's weekday index on initial profile loads and aligns `state.activeDay` to it, ensuring that stale active days from previous sessions do not persist on app launch.
*   **Isolated Integration Tests**: Registered `test_integration_user@gmail.com` in both `migration_test.js` and the emulator's pre-configured Auth backup database (`accounts.json`), insulating the user's live profile from automated test updates.
*   **Start Day Change Fix**: Reset `currentViewingWeekStartDate` to `null` during mid-week week start day changes in Admin panel. This prevents calendar columns from locking into a stale Sunday-relative view that gets incorrectly flagged as a past week.
*   **Production API Key Rotation**: Replaced the system-revoked production API key with a new restricted key in `firebase.js` that contains website referrer locks, resolving the live login failure.
*   **Robust Environment Selector**: Upgraded host detection in `firebase.js` to automatically default any non-localhost public domain (like `crsjain.github.io`) to Production. This prevents custom hosting sites from falling back to emulator config templates that use staging dummy key values.
*   **Dynamic Dates in Regression Tests**: Restructured Test Cases 33 and 34 in `tests.js` to calculate reference dates dynamically (relative to the active `weekStartDate` instead of hardcoded strings), eliminating timezone-dependent test suite failures.
*   **Future Day Locking**: Blocked clicking day headers or checking tasks for days in the future relative to today's date inside the current week, disabling future checkboxes and styling headers/cells as gray/unclickable.
*   **Sandbox bypass for scale-testing**: Enabled future edits bypass automatically if `useEmulator` (localhost) or `isTestMode` (runTests=true) is true, allowing developers to manually fill future days for scale-testing.
*   **PWA Cache Invalidation**: Bumped app version to `v1.7.1 (v57)` and service worker cache to `v57` to force client browsers to invalidate old caching directories and pull the new updates.
*   **All Tests Passed**: Verified that all 35 regression tests run completely green on the local headless test suite.

---

## 5. Files and Code
### Edited Files
*   [state.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/state.js): Added `getEarliestDataWeekStartDate` logic (lines 590-629).
*   [firebase.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/firebase.js): Updated the production API key, rewrote environment selector flags, and exported `useEmulator` and `useProd` flags.
*   [app.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js): Disabled `#prev-week-btn` on bounds, forced activeDay today on startup, reset `currentViewingWeekStartDate` on week start changes, implemented `areFutureEditsAllowed()` helper, locked future day checkbox updates/cell highlights/header clicks, and bumped version to `v1.7.1 (v57)`.
*   [service-worker.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): Bumped cache ID to `'poke-chart-cache-v57'`.
*   [style.css](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css): Appended styling definitions for `.day-header.future-day-header` and `.checkbox-cell.future-cell`.
*   [tests.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): Rewrote Test Cases 33 and 34 to compute reference dates dynamically; added **Test Case 35** to verify future day locking and sandbox bypass behaviors.
*   [migration_test.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/migration_test.js): Changed test login credentials to isolated test account `test_integration_user@gmail.com`.
*   [emulator_data/auth_export/accounts.json](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/emulator_data/auth_export/accounts.json): Added pre-configured account entry for the test integration user.

---

## 6. Validation Instructions

### Local Manual Verification
1. Launch the app locally: `http://127.0.0.1:8085/index.html?exposeState=true`.
2. Check that today's day is selected as the active column.
3. Click "Prev Week" repeatedly until you reach `Jun 29 - Jul 5, 2026`. Verify the "Prev Week" button becomes disabled.
4. Verify that all day headers (`MON`-`SUN`) for the week of `Jun 29` are grayed out, show `not-allowed` cursor, and clicking them does not trigger the day switch modal.
5. In the Admin Panel, change the "Week Start Day" to Friday. Verify that the grid updates correctly and Saturday's checkbox remains enabled and interactive.
