# Product Requirement Document (PRD): Star Vault & Streak Economy

## 1. Objective & Background
To keep a 7-year-old (Kepler) motivated to complete daily educational tasks, we need a flexible incentive system. 

The **Star Vault** serves as the in-game economy. Kids earn stars for completing all daily tasks. Instead of trading stars for real-world prizes (which requires parents to maintain rigid rewards), stars are spent **solely inside the app to unlock new Pokémon partners**. This encourages consistency and leverages the intrinsic motivation of collecting and evolving different Pokémon (including multiple Eevees to get all Eevees forms).

---

## 2. Target Audience
*   **Primary User**: Kepler (7 years old) - needs simple, highly visual, encouraging feedback to select and unlock new partners.
*   **Admin User**: Parents - no longer need to gate unlocks with a password, as the star cost serves as the natural rate-limiter.

---

## 3. Key Features

### 3.1. Daily Star Logging (Auto-Collection)
*   **Trigger**: Automatically logs a star when all tasks for the active day are checked (100% completion).
*   **Persistence**: Saved as YYYY-MM-DD date strings in `state.starVault.earnedDates`.
*   **Frictionless Deletion**: If a parent or child unchecks a task for a completed day, the star is automatically removed from the vault.

### 3.2. Streak Economy (Star Colors)
Consecutive daily completions increase the streak count, upgrading the star's color:
*   **Streak Day 1-2**: 🌟 **Yellow Star** (Standard)
*   **Streak Day 3-4**: 🥈 **Silver Star** (Uncommon)
*   **Streak Day 5-9**: 📘 **Blue Star** (Rare)
*   **Streak Day 10+**: 🌈 **Prism Star** (Legendary - animated rainbow gradient with sparkle particles)

*Note: Gaps in dates break the streak, resetting the next earned star to Day 1 (Yellow).*

### 3.3. Star Vault Cabinet Modal
*   **Access**: Click the "⭐ Vault" button next to the Daily Total row in the grid.
*   **UI**: Renders stars inside a 10-column (5-column on mobile) "Royal Velvet" grid container.
*   **Pagination**: Displays 40 slots per page (20 on mobile) with "Prev/Next" buttons to scroll through history.
*   **Spend Shortcut (UX Link)**:
    *   An active button is always present at the bottom to visit the shop.
    *   If the child has **5 or more remaining stars**: Shows a glowing, pulsing button: **"Go to Pokémon Shop! 🚀 (Ready to Unlock!)"**.
    *   If they have **less than 5 stars**: Shows the button with text: **"Go to Pokémon Shop! 🚀 (Earn [X] more stars to unlock Pokemon! 💪)"** (where X is `5 - remainingStars`).

### 3.4. Pokémon Partner Unlock Shop (Tiered Star Spending)
*   **Access**: Accessible at all times by clicking the "+" (Get New Pokémon) card inside the "Choose Your Partner" modal, or via the Star Vault Spend Shortcut.
*   **Pricing Tiers**:
    *   **Normal / Starter Pokémon (⭐ 5 Stars)**: Standard base Pokémon & starters (*Pikachu, Charmander, Bulbasaur, Squirtle, Eevee, Vulpix, Psyduck, etc.*).
    *   **Rare Pokémon (⭐ 10 Stars)**: Pseudo-legendaries and fan-favorites (*Larvitar, Riolu, Togepi, Lapras, Snorlax, Gible, Axew, Dreepy, Tinkatink, etc.*).
    *   **Legendary / Mythical Pokémon (⭐ 15 Stars)**: All species in `LEGENDARY_POKEMON_IDS` (*Mewtwo, Rayquaza, Kyogre, Groudon, Mew, Lugia, Dialga, Calyrex, etc.*).
*   **Shop Filters**:
    *   **Type Dropdown**: Filter by Pokémon type (*Fire, Water, Grass, Electric, etc.*).
    *   **Cost Dropdown**: Filter by star pricing tier (*All Costs / ⭐ 5 Stars / ⭐ 10 Stars / ⭐ 15 Stars*).
*   **Locked State (Browse Mode)**:
    *   Cards show dynamic progress bars scaling to that card's cost (e.g., `3/5 Stars`, `7/10 Stars`, `12/15 Stars`).
    *   Cards with `remainingStars >= cardCost` are styled as **affordable** (glowing border, hold button active).
    *   Pokémon cards with evolution configurations in the app display a bouncing sparkle emoji `✨` next to their name (in both browse grid and details screens) to visually signal their evolution potential.
*   **No Parent Gate**: Unlocking does NOT require a parent password.
*   **Confirmation Gesture (Hold-to-Unlock)**:
    *   When the child has sufficient stars and selects a Pokémon, it opens a details screen with a **"Hold to Unlock"** button.
    *   The child must press and hold the button for **3 seconds**.
    *   A circular progress meter fills during the hold. If they release early, the meter resets to prevent accidental unlocks.
*   **Duplicate Support**: Children can unlock Pokémon they already have to level and evolve them differently.

### 3.5. Star Deduction & Accelerando Star Swarm Animation (Option A)
Once the Hold-to-Unlock meter fills, it triggers this visual sequence:
1.  **Deduction Stage**: An overlay displays the target Pokémon silhouette behind a lock, with $N$ star slots ($N \in \{5, 10, 15\}$).
2.  **Accelerando Swarm**: $N$ stars rapidly stream into the slots with an exponential acceleration curve ($< 2.0	ext{s}$ total).
3.  **Progressive Audio**: Ascending pitch dings scale smoothly across the $N$ stars ($C_5 
ightarrow C_6$).
4.  **Lock Rattle & Shatter**: The lock vibrates with tension (`.rattling`) for 350ms, then shatters with an explosion of confetti particles.
5.  **Reveal & State Commit**: The full-color Pokémon artwork is revealed, stars are deducted from the vault (`state.starVault.totalTraded += cost`), the new partner instance is registered in `state.partnersData`, and it is set as the active partner.

---

## 4. Technical Schema (State V16)
Stored in `state`:
*   `activePartnerInstanceId`: The unique ID of the currently active partner (string, e.g. `'25'` or `'133_171732948239'`).
*   `partnerFamily`: The family ID of the active partner (string, e.g. `'25'` or `'133'`), kept for backwards compatibility.
*   `partnersData`: Map of partner instances:
    ```javascript
    state.partnersData = {
      // Keys are unique instance IDs
      'pikachu_default': { 
        familyId: '25', 
        level: 1, 
        xp: 0, 
        stageId: '25' 
      },
      'eevee_1': { 
        familyId: '133', 
        level: 5, 
        xp: 0, 
        stageId: '134' // Vaporeon
      },
      'eevee_2': { 
        familyId: '133', 
        level: 1, 
        xp: 0, 
        stageId: '133' // base Eevee
      }
    };
    ```
*   `starVault`:
    *   `earnedDates`: Array of date strings `["YYYY-MM-DD", ...]`.
    *   `totalTraded`: Number of stars spent on unlocks.
        *   **Star Debt Rule (Option A)**: `totalTraded` is NOT clamped by `earnedDates.length` in diagnostics. If tasks are unchecked after spending, `remainingStars` (`earnedDates.length - totalTraded`) can go negative internally.
        *   **UI Clamping**: The UI will always display `Math.max(0, remainingStars)` so kids do not see negative numbers.

---

## 5. Diagnostics & Migration
*   **Migration (V15 to V16)**:
    1.  Initialize `state.activePartnerInstanceId = state.partnerFamily || '25'`.
    2.  For each key in `state.partnersData`, ensure it has `familyId` set to its key value if not present.
*   **Diagnostics Updates**:
    *   Verify `state.activePartnerInstanceId` exists and points to a valid key in `state.partnersData`.
    *   Do NOT clamp `state.starVault.totalTraded` to `state.starVault.earnedDates.length` (to preserve Star Debt).

---

## 6. Manual Verification Workflows

To verify all the changes locally from a user/parent workflow standpoint, you can walk through the following manual test scenarios. 

Open your browser's Developer Tools Console (`F12` or `Cmd+Option+I`) alongside the app to help inject stars for testing. Make sure to load the app with local storage exposed: `http://127.0.0.1:8085/index.html?exposeState=true`.

### Workflow 1: Vault Spend Button & Shop Accessibility (Less than 10 Stars)
1. **Initial State**: Start with 0 or a few stars (e.g., 3 stars).
2. **Check Vault Button**: Click the **⭐ Vault** button next to the daily total row in the task grid.
3. **Verify Spend Shortcut**:
   - The button at the bottom of the Vault modal should read: **"Go to Pokémon Shop! 🚀 (Earn [X] more stars to unlock Pokemon! 💪)"** (where `X` is `10 - your_current_stars`).
   - Click it. It should close the Vault and open the Pokémon Shop modal.
4. **Browse Locked Cards & Filters**:
   - The shop should render base Pokémon cards (e.g. Bulbasaur, Gastly, Mew, Eevee) marked as **locked** with a padlock icon and a progress bar (e.g. `3/10 Stars`).
   - Confirm that evolved stages of all species (e.g. Charizard, Blastoise, Raichu, Gengar, Pupitar) are **not** present in the grid, preserving their evolution-only progression.
   - Use the **Type Filter dropdown** (e.g., select "Fire"). Verify only basic Fire-type Pokémon (like Charmander or Vulpix) are shown.
   - Check the **Legendary Only checkbox**. Verify only basic Legendary Pokémon (like Mew, Kyogre, or Reshiram) are shown.
   - Reset the filters by selecting "All Types" and "All Costs" (or close and reopen the shop modal). Verify all base cards are displayed again.
5. **Disabled Hold gesture**:
   - Click any locked Pokémon card (e.g., Mew). It should show details, and the unlock button should be disabled, showing: **"Earn [X] more stars!"**
   - Click **◀ Back** to return to browse.

### Workflow 2: Hold-to-Unlock & Star Deduction Animation (10+ Stars)
1. **Inject 10 Stars (Cheat code)**:
   Paste and run this snippet in your browser console to inject 10 stars into your current profile's local storage:
   ```javascript
   (function() {
     const state = JSON.parse(localStorage.getItem('kepler_tasks_state') || '{}');
     if (!state.starVault) state.starVault = {};
     // Inject 10 dates to earn 10 stars
     state.starVault.earnedDates = Array.from({length: 10}, (_, i) => `2026-07-${10+i}`);
     state.starVault.totalTraded = 0;
     localStorage.setItem('kepler_tasks_state', JSON.stringify(state));
     location.reload();
   })();
   ```
2. **Ready to Unlock State**:
   - Open the **⭐ Vault** modal. The Spend button should now glow and pulse, reading: **"Go to Pokémon Shop! 🚀 (Ready to Unlock!)"**.
   - Click it to go to the shop.
   - The cards in the shop should now look colorful and be styled as **affordable** (glowing border on hover, lock badges removed).
3. **Cancel Early Gesture**:
   - Click on **Mew**. The details page should say: **"Ready to welcome Mew to your team for 10 Stars? 🌟"**
   - The **Hold Down to Unlock! 🔓** button should be active.
   - Click and hold the button. Observe the circular progress border filling up.
   - **Release your hold after 1.5 seconds**. The progress circle should instantly reset to 0%, and no purchase should trigger (stars remain unspent).
4. **Complete Hold & Watch Animation**:
   - Press and hold the button again for a **full 3 seconds**.
   - The screen should transition to the **Celebration Overlay**:
     - Mew's silhouette is displayed behind a large padlock, surrounded by 10 empty star contours.
     - 10 stars will fly one by one from the top right counter into the contours.
     - You should hear **progressive pitch dings** for each star that lands.
     - Once the 10th star lands, the lock shatters, Mew is revealed in full color, confetti explodes, and the triumph sound plays.
     - The shop closes automatically, and Mew is now shown as your active partner on the main grid screen.


