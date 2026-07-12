# Product Requirement Document (PRD): Star Vault & Streak Economy

## 1. Objective & Background
To keep a 7-year-old (Kepler) motivated to complete daily educational tasks, we need a flexible incentive system. Traditional systems map points directly to physical rewards too early, which locks parents into rigid rules. 

The **Star Vault** solves this by separating the act of earning (daily task completion) from spending (trading stars for rewards). It introduces a gamified "Streak Economy" where consecutive daily completions upgrade the visual style of the stars, leveraging intrinsic collection motivation.

---

## 2. Target Audience
*   **Primary User**: Kepler (7 years old) - needs simple, highly visual, encouraging feedback.
*   **Admin User**: Parents - need simple controls to verify and deduct/trade stars when physical rewards are claimed.

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
*   **UI**: Renders stars inside a 10-column (5-column on mobile) "Royal Velvet" grid container resembling a physical badge case shelf.
*   **Pagination**: Displays 40 slots per page (20 on mobile) with "Prev/Next" buttons to scroll through history.
*   **Tooltips**: Hovering over a star shows the date earned and streak status (e.g., "Streak Day 5 (BLUE)").

### 3.4. Parent-Verified Inline Trading
*   **Trigger**: Click "Spend Stars for a Reward!" inside the Vault modal.
*   **Security**: Locked behind a Parent Gate password prompt (`zxcv`).
*   **Functionality**: Allows parents to select how many stars to trade/deduct from Kepler's balance when he claims a physical reward in the real world.
*   **Feedback**: Triggers particle celebrations on successful trade.

---

## 4. Technical Schema (State V9+)
Stored in `state.starVault`:
*   `earnedDates`: Array of date strings `["YYYY-MM-DD", ...]`.
*   `totalTraded`: Number of stars spent.
*   `weekStartDate`: Tracks the current week's starting Sunday to correctly resolve grid column index to real dates.
