# CHECKPOINT 20

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this document to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests
- [x] Manage custom rewards lists per child profile in a spacious dashboard modal (done)
- [x] Address empty blank space under task editor in Admin Panel (done)
- [x] Style solid high-contrast SVG icons for Admin profiles list actions (done)
- [x] Configure screensaver inactivity timeout slider/select in Admin Panel (done)
- [x] Prevent profile grid overflow and disable horizontal scrolling on profile items (done)
- [x] Document dashboard modal & transparent scrollbar guidelines in `ux-guidelines.md` (done)
- [x] Resolve sharp top-right/bottom-right corners on Parent Admin modal by making scrollbar tracks transparent (done)
- [x] Fix critical bug where toggling an exception off (back to a required task) causes the task to automatically flip back to an exception after 1 second (done)

---

## 2. User & Project Metadata
*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Target Audience**: Kepler (7 years old) and Lyra (5 years old)
*   **Current Version**: `v1.7.1 (v54)` / Service Worker cache `v54`
*   **Active Port**: `8085` (running Python web server)
*   **Firebase Emulator Project**: `demo-pokemon-chart` (Firestore UI on port `4000`, DB on `8080`, Auth on `9099` - running in background)
*   **Parent Email**: `crsjain@gmail.com`
*   **Admin Password**: `zxcv`
*   **Git Policy**: Dev branch commits and pushes to origin. Merges to main to deploy.

---

## 3. Active V14 State Schema
```javascript
export let state = {
  version: 14,
  partnerFamily: '25', // Default Pikachu Family
  weekStartDay: 0, // Default Sunday (0) to Saturday (6)
  idleTimeout: 10, // Default 10 minutes
  weeklyRewardOptions: [...DEFAULT_WEEKLY_REWARDS],
  megaRewardOptions: [...DEFAULT_MEGA_REWARDS],
  excused: {}, // key format: "day-task" -> boolean
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
  grid: {}, // key format: "day-task" -> boolean
  tasks: [
    { id: 'piano', name: 'Piano Practice', emoji: '🎹', concept: 'Level up!', instructions: 'Play all pieces 3x and work on hard parts.' },
    { id: 'math', name: 'Math Practice', emoji: '🧮', concept: 'Intellect +1', instructions: "Complete today's worksheet or 15 mins on math app." },
    { id: 'reading', name: 'Reading Time', emoji: '📚', concept: 'Explore new zones!', instructions: '15min reading out loud w/30s summary.' },
    { id: 'writing', name: 'Writing', emoji: '✏️', concept: 'Skill mastery', instructions: 'Write at least 3 clean sentences w/punctuation.' },
    { id: 'chinese', name: 'Chinese', emoji: '💮', concept: 'Character master!', instructions: 'Practice reading current vocabulary card set 2x.' }
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
- **Per-child Custom Rewards**: Implemented rewards customization per profile inside a side-by-side multi-column **Dashboard Modal** on desktop (collapsing to single-column stack on mobile). Locked inputs at the bottom of the columns and scroll-contained the reward lists.
- **Admin Modal Cleanups**:
  - Fixed empty gap in Task Editor list by removing fixed `max-height` and letting the container stretch.
  - Replaced text actions with solid white monochrome SVGs on red backgrounds for profile deletes and profile rewards edit triggers, saving screen space.
  - Truncated profile names inside lists with ellipsis to prevent cards from overflowing horizontally.
- **Inactivity screensaver configuration**: Added a Screensaver Timeout select element inside the Admin Panel settings grid. Parents can customize the timeout (10m, 5m, or off) and sync it to the profile state.
- **Stale Snapshot Rollback Fix**: Resolved the critical bug where unchecking a task exception would automatically revert to an exception after 1 second. Hooked an `isCloudSavePending` boolean check to the Firestore snapshot listener, ensuring that local memory state changes are protected from being overwritten by stale cloud snapshots while a debounced Firestore write is in flight.
- **UX Guidelines additions**: Wrote rules for Dashboard Modal responsiveness and scrollbar transparency inside `_agents/rules/ux-guidelines.md`.
- **Admin panel sharp corners fix**: Custom styled `.modal-content` scrollbars with transparent tracks and rounded Webkit thumbs so the native system scrollbars don't draw sharp rectangles over the container's 12px rounded borders.
- **Automated Tests**: Updated `tests.js` to assert all the new behaviors (screensaver configurations, reward models, and version checks), passing all 31 tests.

---

## 5. Files and Code
### Edited Files
*   [app.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js): Added isCloudSavePending flag, modified snapshot listener update logic, and bumped version to `v1.7.1 (v54)`.
*   [style.css](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css): Appended layout constraints for multi-column dashboard modal, custom scrollbars, and white action SVGs.
*   [index.html](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html): Swapped Backup/Restore names, added new rewards modal grid structure, and included Screensaver Timeout selects.
*   [service-worker.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): Bumped cache to `poke-chart-cache-v54`.
*   [tests.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): Incremented version assertion to `v1.7.1`.
*   [_agents/rules/ux-guidelines.md](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/rules/ux-guidelines.md): Added Rules 4 and 5 documenting multi-column layouts and scrollbar transparency.
*   [README.md](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md): Documented new Screensaver and Profile Custom Rewards features.

---

## 6. Validation Instructions

### Local Manual Verification
1. Open the app in staging (or launch python server: `python3 -m http.server 8085` and navigate to `http://localhost:8085`).
2. Log in with the admin password `zxcv`.
3. Open "Manage Profiles", verify the names list fits without scrollbars and displays white trash/gift SVGs.
4. Click the gift SVG (Rewards) next to a profile. Verify the Rewards modal is wide (1000px) and presents Weekly and Mega lists side-by-side with locked bottom inputs.
5. Add/delete a reward, and scroll inside each column independently.
6. Verify the "Screensaver" selection in the Admin Panel correctly saves changes (e.g. changing to 5 minutes saves `state.idleTimeout = 5` in the cloud).
7. Go to "Set Exceptions" on the main grid. Click a cell to make it an exception (star-vault pokeball). Click it again to turn it back to a required task. Verify that the task **remains** a required task and does not flip back on its own after 1 second.
