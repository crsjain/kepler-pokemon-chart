# CHECKPOINT 56

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Diagnose & Fix Prod "Phantom Pichu" Mass-Duplication Incident**:
  - Investigated issue where rapid clicking / multi-touch on "Hold Down to Adopt Another" in the Pokémon Shop resulted in missing sprites (`.../null.png`), phantom entries in `partnersData`, and a wall of Pichus across profiles (Lyra & Alden).
  - Root cause identified: `initShop()` was re-run on every Firestore snapshot from `app.js:963`, attaching an anonymous `touchstart` arrow function each time. Un-deduplicated listeners stacked so one tap spawned N hold-timers, N−1 of which survived `cancelHold()` and executed `triggerUnlockFlow(null)`.
  - Stored `partnersData['null_<ts>'] = { familyId: 'null' }`, which subsequent clicks of **Run Diagnostics** laundered into `'172'` (Pichu).
  - Fixed in `shop.js`:
    - Named `handleTouchStart` and added one-shot `isShopInitialized` listener binding guard.
    - Added `clearHoldTimers()` re-entrancy teardown in `startHold()`.
    - Added `isBuyablePokemonId(id)` validation and `isUnlockInFlight` lock in `completeUnlock()`.
    - Added grant-time affordability re-validation in `triggerUnlockFlow()`.
    - Added `resetShopSession()` export to cleanly tear down holds on profile switch.
  - Hardened sibling modules (`vault.js`, `badges.js`, `guide.js`) with one-shot listener guards to prevent stacking pagination/modal handlers.
  - Hardened profile switching (`app.js`): `resetShopSession()` invoked alongside `clearParentGrace()`.
  - Added data repair tools (`state.js`, `admin.js`, `index.html`):
    - `findPhantomPartners()` and `cleanupPhantomPartners()` keyed on the surviving `null_<ts>` forensic marker.
    - Added **Fix Glitched Partners** admin button with `.schedule-hero-card` confirm dialog previewing phantom count and star refund.
    - Updated `runStateDiagnostics()` to safely quarantine phantom-keyed records and refund stars rather than relabelling them as Pichu.
  - Added 3 new regression test blocks (**Test Cases 86, 87, 88**; 26 new assertions). Negative control verified Test 86 failed with 8 duplicates on pre-fix code.
- [ ] **Follow-up: Remove Temporary Cleanup Button**:
  - Once the user has used the **Fix Glitched Partners** admin tool on the affected child profiles in production, remove the temporary UI button from `admin.js` and `index.html` (retaining the core helper functions in `state.js` for Test 87).

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (gamified training chart)
*   **Current Version**: `v1.10.22` / Service Worker cache `poke-chart-cache-v161` / Asset tags `style.css?v=10.54`, `app.js?v=10.46`
*   **Admin Password**: `"zxcv"`
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`)
*   **Git Policy**: Changes committed to `prototype/pokemon-badge-collection` and merged to `main`. Push only via `session-wrapup`.
*   **Audio/Volume Settings**: Default volume 50%, synthesized 8-bit web audio chimes.
*   **Test Suite**: 83 test blocks, numbered `11–39, 41, 42, 45–88`. Run via `node run_headless_tests.js` (~17s).

---

## 3. Active V18 State Schema

```javascript
{
  version: 18,
  activePartnerInstanceId: '172',
  partnerFamily: '172',
  weekStartDay: 0,
  idleTimeout: 10,
  adminPassword: 'zxcv',
  timezoneOffset: 'default',
  lockPastDays: false,        // Per-profile past-day editing passcode gate (default: false)
  parentGraceMinutes: 2,      // Per-profile parent edit grace window duration in minutes (1 | 2 | 5)
  weeklyRewardOptions: [...DEFAULT_WEEKLY_REWARDS],
  megaRewardOptions: [...DEFAULT_MEGA_REWARDS],
  excused: {}, // key format: "YYYY-MM-DD-task" -> 'bonus' | 'rest' | boolean (legacy true = 'rest')
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
  pendingWeekStartDate: null,
  pendingWeekStartDay: null,
  activeWeeklyBadgeId: 1,
  collectedBadges: [],
  starVault: {
    totalStars: 0,
    totalTraded: 0,
    earnedDates: [] // Array of "YYYY-MM-DD"
  },
  profiles: {
    "kepler": { id: "kepler", name: "Kepler", role: "child" },
    "lyra": { id: "lyra", name: "Lyra", role: "child" }
  },
  activeProfileId: "kepler"
}
```

> [!NOTE]
> Schema version remains **V18**. Corrupted partner entries keyed by `null_<ts>` are cleaned up or quarantined by runtime logic and do not require a schema migration bump.

---

## 4. Work Accomplished

### Root Cause Fixes
* **`shop.js`**:
  - Replaced inline anonymous `touchstart` listener with named `handleTouchStart` and one-shot `isShopInitialized` check.
  - Added `clearHoldTimers()` in `startHold()` to tear down prior timer before re-arming.
  - Added `isBuyablePokemonId(id)` check and `isUnlockInFlight` lock in `completeUnlock()` to reject null or un-adoptable IDs.
  - Added grant-time affordability re-check inside `triggerUnlockFlow()` animation completion callback to prevent overdrafting stars.
  - Exported `resetShopSession()` for profile-switching safety.
* **`pokemon_data.js`**:
  - Added `isBuyablePokemonId(id)` validator function ensuring ID is finite, present in `POKEMON_MAP`, and not an evolved-only species.
* **`vault.js`**, **`badges.js`**, **`guide.js`**:
  - Added `isVaultInitialized`, `isBadgeCaseInitialized`, and `isGuideInitialized` one-shot guards preventing stacked listener accumulation across snapshots.
* **`app.js`**:
  - Called `resetShopSession()` inside `selectProfile()`.
  - Added `reinitShop` and `resetShopSession` to `window.__test_helpers__`.

### Data Recovery & Diagnostics Protection
* **`state.js`**:
  - Exported `PHANTOM_INSTANCE_KEY_RE` and implemented `findPhantomPartners()` / `cleanupPhantomPartners()`.
  - Updated `runStateDiagnostics()` to quarantine (remove) corrupted `null_<ts>` partner entries instead of resetting their `familyId` to `'172'`, and refund `5 * phantomsRemoved` stars from `starVault.totalTraded`.
* **`admin.js` & `index.html`**:
  - Added **Fix Glitched Partners** button under System & Debug with a `.schedule-hero-card` modal previewing the number of phantoms found and estimated star refund before executing.
* **`README.md`**:
  - Documented the partner repair tool and diagnostics healing updates.
* **Cache & Asset Invalidation**:
  - Bumped Service Worker cache from `poke-chart-cache-v160` to `poke-chart-cache-v161`.
  - Bumped asset tags to `style.css?v=10.54` and `app.js?v=10.46`.

### Verification & Testing
* Added **Test Cases 86, 87, 88** (26 new assertions):
  - **86**: Simulates 6 repeated shop init passes followed by a single touch gesture; asserts exactly 1 adoption occurs and exactly 1 Pokémon's cost is charged.
  - **87**: Verifies forensic detection and cleanup of phantom partners, asserts legitimate Pichu and Eevee partners are untouched, confirms star refund, active partner reassignment, and idempotency.
  - **88**: Confirms `runStateDiagnostics()` quarantines phantom entries, refunds stars, and never relabels them to Pichu.
* Negative control verification: Temporarily reverting guards reproduced the bug (8 adoptions from 1 tap) and failed Test 86. With fixes applied: 100% pass across all 83 test blocks.

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_56.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_56.md)

### Edited Files
* [`shop.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/shop.js): One-shot listener init, touchstart named handler, re-entrancy guards, null ID validation, grant-time balance check, session reset.
* [`pokemon_data.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/pokemon_data.js): Added `isBuyablePokemonId()`.
* [`vault.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/vault.js): One-shot init guards for vault and admin listeners.
* [`badges.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/badges.js): One-shot init guard.
* [`guide.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/guide.js): One-shot init guard.
* [`state.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/state.js): Added phantom detection, cleanup, and diagnostics refund.
* [`admin.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/admin.js): Added Fix Glitched Partners handler with hero card confirm.
* [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html): Added Fix Glitched Partners button, bumped asset versions.
* [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): Bumped cache to v161.
* [`app.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js): Profile reset call and test helpers.
* [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): Added Test Cases 86–88.
* [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md): Documented new tools and diagnostics behavior.

---

## 6. Validation Instructions

1. **Production Cleanup (For Parent)**:
   - Deploy `main` and open `https://crsjain.github.io/kepler-pokemon-chart/` on parent device.
   - Force App Update / hard refresh to ensure `v161` is loaded.
   - For **Lyra**: Open Admin (`zxcv`) ➔ Click **Fix Glitched Partners** ➔ Verify the dialog previews ~15 phantoms and star refund ➔ Click **Remove & Refund 🧹**.
   - For **Alden**: Switch to Alden ➔ Open Admin ➔ Click **Fix Glitched Partners** ➔ Click **Remove & Refund 🧹**.
   - Check partner selection modal for each child: verify the extra Pichus are gone and party is clean.
2. **Automated Suite**:
   - Run `node run_headless_tests.js`: verify 100% pass (~17s) across all 83 test blocks.
