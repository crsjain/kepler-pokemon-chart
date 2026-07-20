# CHECKPOINT 19

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this document to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests
- [x] Merge development branch `prototype/pokemon-badge-collection` into `main` and deploy to production (done)
- [x] Restore Kepler's progress in production (the user has instructions to do so)
- [x] Fix empty task chart in staging due to Firestore dotted keys bug (done)
- [x] Allow clicking outside "Who is Training Today?" modal to cancel and return to current child profile (done)
- [x] Rename Backup & Restore CTAs for clarity (Backup Child, Restore Child, Backup Family, Restore Family) (done)
- [x] Auto-switch active profile view on database restore if the current profile was deleted/missing (done)

---

## 2. User & Project Metadata
*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Target Audience**: Kepler (7 years old) and Lyra (5 years old)
*   **Current Version**: `v1.5.8 (v41)` / Service Worker cache `v41`
*   **Active Port**: `8085` (running Python web server)
*   **Firebase Emulator Project**: `demo-pokemon-chart` (Firestore UI on port `4000`, DB on `8080`, Auth on `9099` - running in background)
*   **Parent Email**: `crsjain@gmail.com`
*   **Admin Password**: `zxcv`
*   **Git Policy**: Merged to main and pushed to remote origin main to trigger GitHub Pages hosting deployment.

---

## 3. Active V12 State Schema
```javascript
export let state = {
  version: 12,
  partnerFamily: '25', // Default Pikachu Family
  weekStartDay: 0, // Default Sunday (0) to Saturday (6)
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
- **Firestore Dotted Keys Hotfix**: Refactored `firebase.js` Firestore updates to use nested objects instead of literal dotted-string keys (which were causing data reads to fail and resulting in a blank chart on staging).
- **Click-Outside Modal Cancellation**: Added a click listener to the `profile-select-modal` backdrop so clicking outside closes the modal and returns the user to the active profile (if one exists). Left unchanged when no profile is active.
- **Backup & Restore CTA Renaming**: Renamed Backup & Restore buttons for clarity:
  - `Export Profile` ➔ `Backup Child` (Single active profile progress backup)
  - `Import Profile` ➔ `Restore Child` (Single active profile progress restore)
  - `Cloud Export` ➔ `Backup Family` (Full family database backup)
  - `Cloud Import` ➔ `Restore Family` (Full family database restore)
- **Auto-Switch Profile on Restore/Delete**: Handled the scenario in `app.js`'s `subscribeToProfiles` listener where the active profile is missing/deleted from the DB list (e.g. following a full database restore). The app now automatically switches active view to the first available restored profile (or opens the select modal if empty).
- **Automated Tests**: Appended Test Case 25 (Modal Click-Outside Cancellation) and Test Case 26 (Auto-Switch Profile on Restore/Delete) in `tests.js` and confirmed all 26 headless tests pass.
- **Version Upgrades**: Incremented the app version sequentially up to `v1.5.8 (v41)` to clear service worker caches and ensure users get the hotfixes.

---

## 5. Files and Code
### Edited Files
*   [firebase.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/firebase.js): Nested object updates for Firestore `setDoc`.
*   [app.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js): Added modal click listener, auto-switch logic inside `handleProfilesUpdate`, version bump, and test helper exports.
*   [index.html](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html): Renamed Backup/Restore buttons and updated their mobile-friendly tooltips.
*   [tests.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): Added Test Cases 25 and 26.
*   [service-worker.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): Incremented cache version.
*   [README.md](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md): Documented new Backup & Restore Child / Family terminology.

---

## 6. Validation Instructions
1. Navigate to the production site or local staging environment.
2. Force reload (`Ctrl + F5` or `Cmd + Shift + R`) to pull the latest `v1.5.8 (v41)`.
3. Open the **Parent Admin Panel** (password: `zxcv`).
4. Click **Restore Family** and paste the Kepler V12 JSON backup. Click OK, then confirm.
5. The page should reload and automatically select Kepler (Charmander lvl 4, 8 stars, Greninja badge).
6. Click **Switch Trainer** (the screen blurs and modal opens).
7. Click the dark blurred backdrop outside the modal. The modal should close, and you should return to Kepler's grid without changes.
