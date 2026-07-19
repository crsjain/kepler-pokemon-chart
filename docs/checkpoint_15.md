# Checkpoint 15: Firebase Emulator Setup & Local Storage Migration

This document contains a complete record of user requests, system configurations, version progress, and active schema definitions for Kepler's Pokémon Training Chart app. **Use this block to initialize your next pair-programming session.**

---

## 1. Context and Objective
We are transitioning the Kepler Pokémon Chart app from a single-user `localStorage` setup to a multi-child Firestore-backed architecture, with support for offline synchronization, offline testing, and seamless migration of existing local user data.

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Target Audience**: Kepler (7 years old) and Lyra (5 years old)
*   **Current Version**: `v1.4.7 (v30)` / Service Worker cache `v30`
*   **Active Port**: `8085` (running Python web server)
*   **Database Mode**: Connecting to local Firebase Emulator (`demo-pokemon-chart`) on `localhost` unless `?useProd=true` is set.

---

## 2. Completed Work & Implementation Details

### A. Decouple Profile Icon from Gameplay
*   **Starters Reverted**: Reverted `STARTER_OPTIONS`, `EVOLUTIONS`, and default `partnersData` inside [state.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/state.js) to the original 5 gameplay starter families (`'25'`, `'4'`, `'1'`, `'7'`, `'133'`).
*   **Visual Avatar Picker**: Created `AVATAR_OPTIONS` containing 15 evolved forms (Charizard, Greninja, Lucario, Glaceon, etc.). These icons populate the "Select Partner Icon" grid during child creation.
*   **Decoupled Card Drawing**: Stored selection as `avatarId` in Firestore. Updated `renderProfilesGrid()` inside `app.js` to draw card icons from `profile.avatarId || '25'` without impacting starting gameplay partners.

### B. Firebase Staging / Local Emulator Configuration
*   **Emulator Files**: Generated `firebase.json` (Auth on `9099`, Firestore on `8080`, UI on `4000`), `.firebaserc` (`demo-pokemon-chart`), and `firestore.rules` (open rules for development).
*   **Emulator Launch Script**: Created executable [run_emulator.sh](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/run_emulator.sh) to handle state persistence using `--import=./emulator_data --export-on-exit`.
*   **Config Mismatch Bypass**: Updated [firebase.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/firebase.js) to dynamically override `projectId` to `demo-pokemon-chart` when localhost is active, preventing token validation `400 Bad Request` failures.

### C. Local Storage Migration Flow
*   **Target Key**: Correctly reads from historical storage key `kepler_pokemon_training_v2`.
*   **Import UI Checkbox**: Shows a mint-green alert box (`#migration-option-container`) inside the Add Child Profile modal when local data is detected, displaying the level and name of the progress found.
*   **State Retention**: Updated `createChildProfile` in `firebase.js` to preserve the grid, streaks, star vault, and badges from the migration payload instead of hard-resetting them to empty.
*   **Archive Cleanup**: Automatically renames `kepler_pokemon_training_v2` to `kepler_pokemon_training_v2_backup` upon successful database creation.

### D. UX & Reliability Fixes
*   **Dynamic Password Prompts**: Updated `promptParentPassword` to support a custom message. Shows *"Enter Parent Password to add a new child:"* for profile creation and *"Enter Parent Password to open Admin Panel:"* for admin actions.
*   **Favicon 404 Warnings**: Added a favicon link inside `index.html` and saved `icon.png` as a fallback `favicon.ico` in the root folder.
*   **SW Auto-Reload**: Added `updatefound` event handler to the Service Worker registration in `app.js` to automatically reload the page when a new version is installed.

---

## 3. Local Files Modified (Uncommitted)

*   `[index.html](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html)`: Dynamic password text container; migration alert container layout; favicon links.
*   `[firebase.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/firebase.js)`: Emulator project ID override; updated `createChildProfile` parameters.
*   `[state.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/state.js)`: Reverted starters and evolution tables to 5 families.
*   `[app.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js)`: Render grid using `avatarId`; dynamic description prompts; local migration logic; SW update-reload listener.
*   `[admin.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/admin.js)`: Dynamic password description parameters; dynamic instructions placeholder.
*   `[service-worker.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js)`: Version bump to v30; cloned background fetch response to avoid crashes.
*   `[tests.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js)`: Version test assertion bump to `v1.4.7`.
*   `[run_emulator.sh](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/run_emulator.sh)`: Persistent emulator startup helper.
*   `[favicon.ico](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/favicon.ico)`: Fallback browser favicon.

---

## 4. Initialization Protocol for Next Session

To resume pair-programming:
1.  **Navigate to repository**: `cd ~/kepler-pokemon-chart`
2.  **Verify server**: Verify the python server is running: `python3 -m http.server 8085 &`
3.  **Start emulator**: Run `./run_emulator.sh` to start local Firestore and Auth.
4.  **Open Chrome**: Load `http://localhost:8085/`.
5.  **Clear PWA cache (if version is not v1.4.7)**: Click F12 -> Application -> Storage -> "Clear site data", then refresh.
6.  **Login**: Use parent email `crsjain@gmail.com` with password `food3333`.

---

## 5. Next Steps

1.  **Test Migration Success**: Inject the live data JSON into local storage, trigger the migration checkboxes, and verify the tasks grid, milestone progress, daily stars, and badge case display correctly.
2.  **Offline State Testing**: Verify app behavior when the emulator is offline or network is disconnected.
3.  **Commit and Push**: Stage and commit all changes, then push to GitHub remote branch `prototype/pokemon-badge-collection` when testing completes.
