# Checkpoint 18: Simplified Firebase Schema & Cloud Backup

This document contains a complete record of user requests, system configurations, version progress, and active schema definitions for Kepler's Pokémon Training Chart app. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

*   - [x] Refactor Firebase Firestore structure to store all family profiles in a single JSON blob in the family document (`users/{familyUid}`) instead of a subcollection (`profiles/`).
*   - [x] Implement "Cloud Export" in Parent Admin Panel to export the entire family database blob to clipboard.
*   - [x] Implement "Cloud Import" in Parent Admin Panel to restore the entire family database blob from clipboard.
*   - [x] Add Test Case 24 to verify Cloud Export/Import UI and mocking.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Target Audience**: Kepler (7 years old) and Lyra (5 years old)
*   **Current Version**: `v1.5.8 (v41)` / Service Worker cache `v41` (Cloud Backup additions)
*   **Active Port**: `8085` (running Python web server)
*   **Firebase Emulator Project**: `demo-pokemon-chart` (Firestore UI on port `4000`, DB on `8080`)
*   **Parent Email**: `crsjain@gmail.com`
*   **Admin Password**: `zxcv`

---

## 3. Active V12 Firestore Schema

All family data is consolidated into a single document under the `users` collection:

**Path**: `users/{familyUid}`

```json
{
  "profiles": {
    "kepler_1234": {
      "name": "Kepler",
      "avatarId": "25",
      "partnerFamily": "25",
      "state": {
        "version": 12,
        "partnerFamily": "25",
        "weekStartDay": 0,
        "partnersData": {
          "25": { "level": 1, "xp": 0, "stageId": "25" }
        },
        "reward": "",
        "megaReward": "",
        "megaWeeks": 0,
        "weeklyClaimed": false,
        "grid": {},
        "excused": {},
        "tasks": [
          { "id": "piano", "name": "Piano Practice", "emoji": "🎹", "instructions": "..." }
        ],
        "rewardHistory": [],
        "megaRewardHistory": [],
        "volume": 50,
        "claimedRewardsHistory": [],
        "activeDay": 0,
        "weekStartDate": "2026-07-20",
        "starVault": {
          "earnedDates": [],
          "totalTraded": 0
        },
        "collectedBadges": [],
        "badgePool": [4, 1, 7, 133],
        "activeWeeklyBadgeId": 25
      },
      "updatedAt": "2026-07-20T04:52:00.000Z"
    }
  },
  "updatedAt": "2026-07-20T04:52:00.000Z"
}
```

---

## 4. Work Accomplished

### A. Firestore Single-Document Consolidation
*   **Refactored `firebase.js`**: Changed database interactions to target `users/{familyUid}` directly.
    *   `subscribeToProfiles`: Subscribes to the family document and maps the `profiles` object fields into the list expected by the UI.
    *   `createChildProfile` / `deleteChildProfile`: Uses nested field paths (e.g. `profiles.profileId`) and `deleteField()` to add/remove profiles within the parent map.
    *   `subscribeToProfileState`: Watches the family document, extracting state changes specific to the active profile (optimized with change check).
    *   `saveProfileStateToCloud`: Writes updates directly to the nested profile path in the family document.

### B. Cloud Backup & Restore UI
*   **Added Cloud Actions**: Expanded the "Backup & Sync" card in the Parent Admin Panel ([index.html](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html)) with **Cloud Export** and **Cloud Import** buttons.
*   **Clipboard Integration**:
    *   **Cloud Export**: Copies the entire family document JSON to the clipboard.
    *   **Cloud Import**: Overwrites the entire family document with the pasted JSON.
*   **UI Wiring**: Handled click listeners in [admin.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/admin.js) and passed appropriate backend callbacks from [app.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js).

### C. Testing & Verification
*   **Test Case 24**: Added a unit test in [tests.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js) to mock the cloud data functions and verify that Cloud Export/Import UI buttons correctly trigger clipboard storage and confirmation popups.

---

## 5. Validation Instructions

1.  **Verify Headless Tests**:
    ```bash
    node run_headless_tests.js
    ```
    Confirm all 24 test cases pass successfully.
2.  **Manual Cloud Export/Import Check**:
    *   Run the emulator (`./run_emulator.sh`) and the server (`python3 -m http.server 8085`).
    *   Log in and go to **Parent Admin Panel -> Backup & Sync**.
    *   Click **Cloud Export**. Open a text editor and paste the copied JSON to verify it contains the full `profiles` map structure.
    *   Click **Cloud Import**, paste the JSON back, and confirm it successfully restores the state.
