# CHECKPOINT 34

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests
- [x] Analyze Firebase 30-day Test Mode security rules expiration warning (done)
- [x] Configure permanent, secure Firestore rules restricting per-user family document access (`request.auth.uid == userId`) (done)
- [x] Update local `firestore.rules` and verify regression tests (done)
- [x] Guide user on Firebase Console rules deployment vs. Firebase App Check (done)
- [x] Fix Test Case 62 password submit button ID assertion in `tests.js` (done)

---

## 2. User & Project Metadata
*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Target Audience**: Kepler & Lyra (gamified training chart)
*   **Current Version**: `v1.8.0` / Service Worker cache `v71` / Asset tag `v=6.6`
*   **Local Server URL**: `http://localhost:8000/`
*   **Admin Password**: `zxcv` (Default fallback, configurable in Parent Admin Panel)
*   **Firebase Projects**: Prod (`pokemon-chart-3154f`), Staging (`kepler-pokemon-chart-staging`)

---

## 3. Active V18 State Schema
```javascript
export let state = {
  version: 18,
  activePartnerInstanceId: '172',
  partnerFamily: '172', // Default Pichu Family
  weekStartDay: 0, // Default Sunday (0) to Saturday (6)
  idleTimeout: 10, // Default 10 minutes
  adminPassword: 'zxcv', // Configurable parent admin passcode
  timezoneOffset: 'default', // Configurable App Timezone ('default' or IANA string)
  weeklyRewardOptions: [...DEFAULT_WEEKLY_REWARDS],
  megaRewardOptions: [...DEFAULT_MEGA_REWARDS],
  excused: {}, // key format: "YYYY-MM-DD-task" -> boolean
  weeklyHistory: {}, // key format: "YYYY-MM-DD" -> { weekStartDay, reward, megaReward, weeklyClaimed, badgeId, xpEarned, megaWeeks }
  partnersData: {
    '172': { familyId: '172', level: 1, xp: 0, stageId: '172' },
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
  activeWeeklyBadgeId: 172
};
```

---

## 4. Work Accomplished
*   **Firestore Database Security Rules Update**:
    *   Resolved impending 30-day Firebase Test Mode expiration warning by designing permanent, secure Firestore rules.
    *   Restricted database access to authenticated family accounts (`request.auth != null`) where each family can only read/write their dedicated document (`request.auth.uid == userId`).
    *   Updated [`firestore.rules`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/firestore.rules) in the repository.
    *   Provided step-by-step instructions for publishing the updated rules in the Firebase Console.
    *   Clarified that Firebase App Check is an optional anti-abuse layer not required for this issue and advised skipping it to avoid unnecessary complexity/dev breakage.
*   **Test Suite Maintenance**:
    *   Fixed button selector ID mismatch in Test Case 62 in [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js) (`password-submit-btn`).
*   **Verification**:
    *   Ran headless test runner (`node run_headless_tests.js`) and verified 100% pass across all 62 test cases.

---

## 5. Files and Code
### Edited Files
*   [`firestore.rules`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/firestore.rules): Defined permanent per-user authentication and data isolation security rules.
*   [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): Fixed submit password button element ID in Test Case 62.
*   [`docs/checkpoint_34.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_34.md): Progress checkpoint for this session.

---

## 6. Validation Instructions
### Automated Tests
Run the headless regression test suite:
```bash
node run_headless_tests.js
```

### Manual Verification
1. **Firebase Console Security Rules**:
   - Open Firebase Console for project `pokemon-chart-3154f`.
   - Go to Firestore Database ➔ Rules.
   - Verify rules are published and no 30-day expiration warning banner is displayed.
2. **Cloud Sync**:
   - Log in with family credentials and verify child profile states sync seamlessly to Firestore.
