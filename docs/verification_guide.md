# 🧭 Dynamic Historical Weeks & Schema Verification Guide

This guide provides the complete, step-by-step procedures for manually testing dynamic historical week boundaries, partial week visual treatments, start-day transitions, micro-week consolidation, and verifying profile JSON schema health.

---

## 🛠️ 1. Environment & Setup

*   **Local Server**: `http://localhost:8000/` (Launch with `python3 -m http.server 8000` if needed).
*   **Parent Admin Passcode**: `zxcv` (Default fallback).
*   **Browser Cache**: Perform a hard refresh (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> or <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>) to ensure the updated Service Worker cache (`v82`) and CSS load (`v=7.7`).

---

## 🧪 2. Step-by-Step Manual Test Scenarios

### 📋 Scenario 1: Immediate Shift (Past/Today Day in Current Cycle)
1. Open the app and click the **Parent Admin** button (⚙️ / Passcode: `zxcv`).
2. Under **Weekly Schedule Settings**, change the **Week Start Day** dropdown to today or an earlier day in the cycle (e.g. Saturday when today is Saturday).
3. **Verify Confirmation Modal**:
   - [ ] Dialog titled **"Change Week Start Day? 📅"** opens.
   - [ ] Displays exact start day and date range.
   - [ ] **Amber Warning Callout**:
     - Title: **⚠️ Permanent Schedule Change**
     - Description: *"Applying this change will save your current chart to history. Because past training history cannot be edited, this schedule change cannot be undone."*
4. Click **"Apply Change"**.
5. **Verify Parent Admin Status Pill**:
   - [ ] Emerald confirmation badge appears: `✅ Schedule Updated! Active chart now starts Saturday (Aug 15 – 21, 2026)`.
6. **Verify Active Grid**:
   - [ ] Grid immediately re-anchors to Saturday start. Saturday is highlighted in bright **Pokémon Yellow** (`.active-day`).

---

### 📋 Scenario 1B: Future Mid-Cycle Shift (Forward Hashing & Reversibility)
1. In Parent Admin, suppose current week starts Monday and today is Wednesday. Change **Week Start Day** to **Friday** (a future day in the current grid).
2. **Verify Schedule Notice Modal**:
   - [ ] Dialog titled **"Schedule Change: Starting Friday 📅"** opens.
   - [ ] Clearly explains: *"The current chart will end early on Thursday, and Friday through the weekend will move to your new Friday chart."*
   - [ ] **Blue Info Callout**: Displays **"ℹ️ Schedule Notice"** explaining that the schedule can be modified or reverted anytime in Parent Admin before Friday.
3. Click **"Apply Change"**.
4. **Verify Active Grid Forward-Hashing**:
   - [ ] **Mon–Thu**: Remain 100% active and editable. Wednesday (today) is highlighted yellow.
   - [ ] **Fri–Sun**: Immediately display **diagonal hatched stripes** (`.superseded-cell` and `.superseded-header`) with disabled checkboxes and tooltip *"These days moved to your new Friday chart! 🚀"*.
   - [ ] **Hashed Headers & Cells Disabled**: Clicking anywhere on the Fri, Sat, or Sun headers or task cells is **completely blocked** (no day-switch confirmation dialogs or accidental task toggles).
   - [ ] **Date Range Banner**: Displays `Aug 10 - 13, 2026 • 4 Days (Start Day Adjusted 📅)`.
   - [ ] **Badge Slot**: Shows `➡️ Rolling Forward to Friday Chart!`.
5. **Verify Reversibility Before Friday**:
   - [ ] Open Parent Admin (⚙️). Notice that:
     - The **Week Start** dropdown displays **Friday** (reflecting the scheduled shift).
     - The status badge below it shows: `📅 Shift Scheduled (Friday)` along with a direct **[ ↩️ Revert to Monday ]** action button.
   - [ ] Revert the schedule using either method:
     - **Method A**: Select **Monday** from the dropdown.
     - **Method B**: Click the **[ ↩️ Revert to Monday ]** button inside the status badge.
   - [ ] Friday, Saturday, and Sunday immediately **un-hash** and restore to full active days with zero data loss.
6. **Verify Thursday Completion & Rollover**:
   - [ ] Re-select Friday in Admin. When Thursday tasks are completed, the week is complete.
   - [ ] When ready to start the new week, clicking **Reset Week Grid** archives the 4-day week into history and launches the fresh 7-day Friday–Thursday chart (`Aug 14 – 20`).

---

### 📋 Scenario 2: Historical Navigation to Partial / Cut-Short Week
1. On the main chart, click the **`◀ Prev`** button in the navigation header.
2. **Verify Historical Grid**:
   - [ ] **Day Headers**: The 7 column headers reflect the **historical start day** from that cycle (e.g., `MON, TUE, WED, THU, FRI, SAT, SUN`), *not* Saturday.
   - [ ] **Date Range Banner**: Displays the actual active span (e.g., `"Aug 10 – 14, 2026 • 5 Days (Start Day Adjusted 📅)"`).
   - [ ] **Active Days (Mon–Fri)**: Task cells display previously recorded completions.
   - [ ] **Superseded Days (Sat–Sun)**:
     - Cells display subtle **diagonal hatched stripes** (`-45deg`).
     - Checkboxes are disabled with semi-transparent muted Pokéballs.
     - Hovering over a hatched cell displays the tooltip: `"These days moved to your new chart! 🚀"`.
     - The **Daily Total** row shows a muted `➖` dash indicator instead of a failing `❌`.
   - [ ] **Weekly Badge Slot**: Unclaimed cut-short badges display the roll-forward chip: `"➡️ Rolled Forward to New Chart!"`.
   - [ ] **Read-Only**: Clicking any cell in this historical view is disabled.

---

### 📋 Scenario 3: Multi-Shift Micro-Week Consolidation (Smart Archiving)
1. Start with a chart on Monday (`Aug 10`). Complete 1 task on Monday.
2. Open Parent Admin (`zxcv`) and shift the start day to **Tuesday** (`Aug 11`). Click **Apply Change**.
3. Immediately open Parent Admin again and shift the start day to **Wednesday** (`Aug 12`). Click **Apply Change**.
4. Click **`◀ Prev`** to view the historical week.
5. **Verify Consolidation**:
   - [ ] **Single Consolidated Entry**: You see **one** historical card spanning `Aug 10 - 11, 2026 • 2 Days (Start Day Adjusted 📅)` rather than two separate 1-day cards.
   - [ ] **Earliest Anchor Rule**: Column 0 is **Monday** (`MON, TUE, WED, THU, FRI, SAT, SUN`). Mon and Tue are active columns, and Wed–Sun have diagonal hatch stripes.
   - [ ] **Task Preservation**: The task completed on Monday is still checked in Column 0.

---

### 📋 Scenario 4: Single-Day Grammar Verification (`1 Day` vs `X Days`)
1. Create a 1-day cut-short week (e.g., start on Monday Aug 10 and immediately shift to Tuesday Aug 11).
2. Click **`◀ Prev`** to view that historical week.
3. **Verify Header Grammar**:
   - [ ] Header banner reads: `"Aug 10 - 10, 2026 • 1 Day (Start Day Adjusted 📅)"` (using singular **"1 Day"**, never *"1 Days"*).

---

### 📋 Scenario 5: Circular Shifts (Full 7-Day Restoration)
1. If you shift the start day forward one day at a time across the week (Mon $\rightarrow$ Tue $\rightarrow$ Wed $\rightarrow$ Thu $\rightarrow$ Fri $\rightarrow$ Sat $\rightarrow$ Sun $\rightarrow$ Monday of next week):
2. Click **`◀ Prev`** to inspect the previous cycle.
3. **Verify Restoration**:
   - [ ] The previous week automatically displays as a **full 7-day Monday–Sunday chart** (`Aug 10 - 16, 2026`).
   - [ ] The partial marker chip (`Start Day Adjusted 📅`) is removed.
   - [ ] All 7 columns are fully active without any diagonal hatched stripes.

---

### 📋 Scenario 6: Chronological Timeline Navigation (`Prev` & `Next`)
1. From any past week, click **`◀ Prev`** repeatedly until reaching the earliest recorded week.
2. **Verify Earliest Boundary**:
   - [ ] When viewing the earliest recorded week, the **`◀ Prev`** button is automatically disabled (`disabled` attribute).
3. Click **`Next ▶`** sequentially forward:
   - [ ] Navigation steps cleanly: `[Earliest Week]` $\rightarrow$ `[Consolidated Past Week]` $\rightarrow$ `[Current Active Week]`.
   - [ ] When viewing the current active week, the **`Next ▶`** button is automatically disabled.

---

### 📋 Scenario 7: Cumulative Mega Milestone Counter (`megaWeeks`)
1. Check the child's active **Mega Milestone** progress (e.g., 2 of 4 badges collected).
2. Open Parent Admin (`zxcv`) and change the Week Start Day to cut short the current week.
3. Apply the change.
4. **Verify Milestone Integrity**:
   - [ ] The cumulative Mega Milestone counter (`megaWeeks`) is **preserved** at 2 badges.
   - [ ] The counter does **not** artificially increment on the cut-short week, nor does it reset to 0.

---

### 📋 Scenario 8: Day-of-Week Exception Carry-Over
1. On the active week, click **"Excuse / Exception"** mode.
2. Excuse a task on **Monday** (e.g., "Piano Practice"). Click **Done ✅**.
3. Change the start day or trigger a week reset with **"Carry over exceptions"** enabled.
4. **Verify Alignment**:
   - [ ] The exception for "Piano Practice" carries over to **Monday** in the new week's column, regardless of whether the new schedule starts on Saturday or Sunday.

---

### 📋 Scenario 9: Multi-Adjustment of Future Start Days (e.g., Friday $\rightarrow$ Saturday)
1. On a Monday-start week (today is Wednesday), set the schedule to **Friday** start (Fri–Sun hashed out).
2. Before Friday arrives, re-open Parent Admin (⚙️) and change the start day to **Saturday**.
3. **Verify Transition Flexibility**:
   - [ ] **Friday Un-hatches**: Friday column immediately becomes a normal active day (Mon–Fri active).
   - [ ] **Sat–Sun Hashed**: Saturday and Sunday remain hashed out.
   - [ ] **Date Range Banner**: Updates dynamically to `Aug 10 - 14, 2026 • 5 Days (Start Day Adjusted 📅)`.
   - [ ] **Admin Status Badge**: Updates to reflect that the current chart ends Friday, and the new chart starts Saturday.

---

### 📋 Scenario 10: Exception Mode Behavior on Hashed Days
1. With a future start day set (e.g. Fri–Sun hashed out on a shortened week), click the **"Excuse / Exception"** button.
2. **Verify Protection**:
   - [ ] Clicking on active days (Mon–Thu) toggles the exception state (`EXCUSED`) as normal.
   - [ ] Clicking on hashed days (Fri–Sun) is **blocked/disabled**, preventing accidental exceptions on days that have moved to the next chart.
3. Click **Done ✅** to exit exception mode.

---

### 📋 Scenario 11: Task Customization During Shortened Week
1. With an active shortened week (e.g. Mon–Thu active, Fri–Sun hashed), open Parent Admin (`zxcv`).
2. Under **Customize Activities & Goals**, add a new task (e.g., "Duolingo Practice") or edit an existing activity.
3. Click **Save Activities**.
4. **Verify Grid Consistency**:
   - [ ] The new task row immediately appears on the chart.
   - [ ] Columns Mon–Thu for the new task have active, clickable checkboxes.
   - [ ] Columns Fri–Sun for the new task are correctly hatched out with diagonal stripes and disabled checkboxes.

---

### 📋 Scenario 12: Friday Morning Grace Period & Manual Rollover
1. Simulate Friday morning arriving on a shortened Monday–Thursday week.
2. Open the chart without resetting yet.
3. **Verify Grace Period**:
   - [ ] The chart still displays the Thursday chart, allowing the child to check off any Thursday evening activities that were finished before bedtime.
   - [ ] Star and XP counters reflect completed Thursday activities.
4. When logging is complete, click **Reset Week Grid** (or confirm the startup reminder).
5. **Verify New Cycle Launch**:
   - [ ] The 4-day week is archived to history.
   - [ ] A clean, full 7-day Friday–Thursday grid launches with Friday as Column 0.

---

### 📋 Scenario 13: Timezone Adjustment During Active Shortened Week
1. In Parent Admin (`zxcv`), change the **Timezone** dropdown (e.g. between UTC, US Pacific, or Sydney).
2. **Verify Active Column Alignment**:
   - [ ] The yellow active day indicator (`.active-day`) moves accurately to the corresponding local day without disturbing the forward-hashed days.
   - [ ] If the local time crosses midnight into Friday, the app appropriately prompts the user to reset the grid.

---

## 🔍 3. Profile Schema & JSON Health Verification

### Method A: Automated Regression Test Suite
Run the automated test suite from the repository root:
```bash
node run_headless_tests.js
```
*Expected Output:*
```
🎉 All regression tests passed successfully!
✅ Tests passed successfully! (65/65 passing in ~19s)
```

---

### Method B: Live Browser Console Verifier (Interactive Diagnostic Script)
To verify the JSON state of a live child profile (e.g. Kepler or Lyra) in real time:

1. Open DevTools (<kbd>F12</kbd> or <kbd>Cmd</kbd> + <kbd>Option</kbd> + <kbd>I</kbd>) and select the **Console** tab.
2. Copy and paste the following script into the console and press <kbd>Enter</kbd>:

```javascript
(function verifyProfileJsonIntegrity() {
  const state = window.__app_state__;
  if (!state) {
    console.error("❌ App state not found on window.__app_state__");
    return;
  }

  console.group("🔍 Running Profile JSON Integrity Check...");
  const errors = [];

  // 1. Check JSON Serialization & Round-Trip
  try {
    const jsonStr = JSON.stringify(state);
    const parsed = JSON.parse(jsonStr);
    console.log("✅ JSON Serialization: Valid (Length:", jsonStr.length, "bytes)");
    
    if (jsonStr.includes("NaN")) errors.push("State contains NaN values!");
  } catch (e) {
    errors.push("Failed JSON round-trip: " + e.message);
  }

  // 2. Schema Type Checks
  if (typeof state.grid !== "object" || Array.isArray(state.grid)) errors.push("state.grid is not an object!");
  if (typeof state.excused !== "object" || Array.isArray(state.excused)) errors.push("state.excused is not an object!");
  if (typeof state.weeklyHistory !== "object" || Array.isArray(state.weeklyHistory)) errors.push("state.weeklyHistory is not an object!");
  if (!Array.isArray(state.collectedBadges)) errors.push("state.collectedBadges is not an array!");
  if (!state.starVault || !Array.isArray(state.starVault.earnedDates)) errors.push("state.starVault.earnedDates is invalid!");

  // 3. Weekly History Entries
  if (state.weeklyHistory) {
    Object.keys(state.weeklyHistory).forEach(dateKey => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        errors.push(`Invalid weeklyHistory date key format: "${dateKey}"`);
      }
      const entry = state.weeklyHistory[dateKey];
      if (typeof entry.weekStartDay !== "number" || entry.weekStartDay < 0 || entry.weekStartDay > 6) {
        errors.push(`Invalid weekStartDay in history entry for ${dateKey}: ${entry.weekStartDay}`);
      }
    });
    console.log(`✅ weeklyHistory: ${Object.keys(state.weeklyHistory).length} archived week(s) cleanly formatted.`);
  }

  // 4. Partner Data Checks
  if (state.partnersData) {
    const active = state.partnersData[state.activePartnerInstanceId];
    if (!active) {
      errors.push(`Active partner ${state.activePartnerInstanceId} missing from partnersData!`);
    } else {
      console.log(`✅ Partner Data: LV ${active.level} (XP: ${active.xp}/100, Stage: ${active.stageId})`);
    }
  }

  // 5. Diagnostics Run
  if (window.__test_helpers__ && window.__test_helpers__.runStateDiagnostics) {
    const diag = window.__test_helpers__.runStateDiagnostics();
    if (diag.issues.length > 0) {
      errors.push("Diagnostics found issues: " + JSON.stringify(diag.issues));
    } else {
      console.log("✅ Diagnostics: 0 schema healing issues found.");
    }
  }

  if (errors.length === 0) {
    console.log("🎉 ALL INTEGRITY CHECKS PASSED: Profile JSON is 100% healthy and intact!");
  } else {
    console.error("❌ Integrity Errors Found:", errors);
  }
  console.groupEnd();
})();
```

3. Confirm that the console logs:
   ```
   🎉 ALL INTEGRITY CHECKS PASSED: Profile JSON is 100% healthy and intact!
   ```

---

## 🔒 4. Key JSON Data Invariants Protected

| State Property | Invariant Guarantee |
| :--- | :--- |
| `state.version` | Strict integer `18`. Never degraded or dropped. |
| `state.partnersData` | Partner levels, XP, and evolution stages are 100% preserved during timeline adjustments. |
| `state.starVault` | All previously earned star dates in `earnedDates` and `totalTraded` remain intact. |
| `state.collectedBadges` | No previously awarded Pokémon badges are lost when adjusting cycles. |
| `state.megaWeeks` | Milestone accumulator preserves count across partial cutoffs (never artificially increments or resets). |
| `state.weeklyHistory` | Map keys strictly formatted as `YYYY-MM-DD` with integer `weekStartDay` $[0, 6]$. Smart Archiving prevents duplicate micro-fragments. |
| `state.grid` / `state.excused` | Stored using calendar dates (`YYYY-MM-DD-taskId`), preventing key collisions across different start days. |
