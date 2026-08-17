# Weekly Grid Column State Machine — Manual Verification Test Plan

This document contains the step-by-step test workflows to manually verify the refactored **Column State Machine** in your local browser (`http://localhost:8000`).

---

## 🎯 Quick Reference: 8-State Visual & Interaction Matrix

| State | Header Color | Header Cursor | Cell Appearance | Checkbox Action | Exception Action | Tooltip |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`ACTIVE_TODAY`** | Pikachu Yellow (`#ffcb05`) | Default arrow | 100% Bright White | Direct check/uncheck | Toggles `+XP` | None |
| **`ACTIVE_PAST`** | Pikachu Yellow (`#ffcb05`) | Default arrow | 100% Bright White | Direct check/uncheck | Toggles `+XP` | None |
| **`ACTIVE_FUTURE`** | Pikachu Yellow (`#ffcb05`) | Default arrow | 100% Bright White | Direct check/uncheck | Toggles `+XP` | None |
| **`SELECTABLE_TODAY`**| Poke Blue (`#2a71d0`) | Pointer hand | Muted (40% opacity) | Prompts switch | Toggles `+XP` | None |
| **`SELECTABLE_PAST`** | Poke Blue (`#2a71d0`) | Pointer hand | Muted (40% opacity) | Prompts switch | Toggles `+XP` | None |
| **`FUTURE_LOCKED`** | Slate Grey (`#cbd5e1`) | Not-allowed 🚫 | Muted / Disabled | Locked (no action) | Toggles `+XP` | None |
| **`SUPERSEDED`** | Diagonal Hash 📐 | Not-allowed 🚫 | Diagonal Hash 📐 | Locked (no action) | Locked (no action) | *"These days moved to your new chart! 🚀"* |
| **`HISTORICAL`** | Slate Grey (`#cbd5e1`) | Not-allowed 🚫 | Muted / Disabled | Locked (no action) | Locked (no action) | None |

---

## 📋 Manual Verification Workflows

### [ ] Workflow 1: Active Day Task Checking & Visual Hierarchy
* **Objective**: Verify standard day interactions, active Pikachu Yellow header text contrast, and active column cell highlighting.
* **Steps**:
  1. Open the app (`http://localhost:8000`). Ensure you are on the current active week.
  2. Locate the header for **Today**.
  3. Click a task checkbox under Today’s column.
* **Expected Visuals & Behaviors**:
  * [ ] **Header Style**: Bright Pikachu Yellow (`#ffcb05`) background with Dark Slate text (`#1e293b`).
  * [ ] **Header Cursor**: Default arrow (not a hand pointer).
  * [ ] **Column Cells**: Bright white background with 100% opacity.
  * [ ] **Other Columns**: Inactive columns appear dimmed/translucent (40% opacity).
  * [ ] **Task Toggle**: Checkbox toggles immediately with sound effects; Daily Total and XP update in real time.

---

### [ ] Workflow 2: Frictionless Return to Today (`SELECTABLE_TODAY`)
* **Objective**: Verify switching away from Today to a past day and jumping back with zero modal friction.
* **Steps**:
  1. Click a **past day header** (e.g., Yesterday).
  2. The **"Switch Day? 📅"** confirmation modal appears. Click **"Switch to [Day]"**.
  3. Notice that the floating **`⚡ Back to Today`** pill button appears above the grid.
  4. Click the **Today header** directly OR click the **`⚡ Back to Today`** pill.
* **Expected Visuals & Behaviors**:
  * [ ] Switching back to Today happens **instantly with 0 confirmation dialogs**.
  * [ ] Yellow header highlight moves back to Today.
  * [ ] The `⚡ Back to Today` pill automatically hides.

---

### [ ] Workflow 3: Future Day Lock & Guardrails (`FUTURE_LOCKED`)
* **Objective**: Verify future days cannot be accidentally selected or checked by a child in Normal Mode.
* **Steps**:
  1. Hover over a **future day header** (e.g., tomorrow or later in the active week).
  2. Attempt to click the future header.
  3. Attempt to click a checkbox in the future column.
* **Expected Visuals & Behaviors**:
  * [ ] **Header Style**: Slate Grey (`#cbd5e1`) background, muted text (`#64748b`), cursor is `not-allowed`.
  * [ ] **Header Interaction**: Clicking the header does **nothing** (no day switch, no confirmation modal).
  * [ ] **Cell Interaction**: Clicking future checkboxes does **nothing** (inputs are disabled).

---

### [ ] Workflow 4: Scenario 10 — Future Exception Toggling in Parent Mode
* **Objective**: Verify parents can pre-excuse upcoming future days without switching active columns.
* **Steps**:
  1. Click the **Parent Admin ⚙️** icon and enter your passcode (`abcd` or `zxcv`).
  2. Click **"Edit Exceptions (Sick/Travel)"**. The top banner appears with a Warm Amber background.
  3. Click a task checkbox on a **Future Day** (e.g., tomorrow's Piano Practice).
  4. Click the **"Done Editing Exceptions"** button on the top banner.
* **Expected Visuals & Behaviors**:
  * [ ] In Exception Mode, the future cell accepts the click, turns dashed yellow with the `+XP` badge, and auto-unchecks tasks.
  * [ ] The active day column highlight does **not** jump to the future day (remains on Today).
  * [ ] Upon exiting Exception Mode, the future day returns to `FUTURE_LOCKED` while retaining its excused status.

---

### [ ] Workflow 5: Mid-Cycle Week Start Shift & Forward-Hashed Columns (`SUPERSEDED`)
* **Objective**: Verify mid-cycle pending shift forward-hashing and interaction lock.
* **Steps**:
  1. Open Parent Admin ⚙️ and change **Week Starts On** to an upcoming day (e.g., Friday).
  2. Confirm the schedule adjustment in the modal.
  3. Observe the grid headers and cells from Friday onward.
  4. Hover over the Friday header, and attempt to click both the header and the cells below it.
* **Expected Visuals & Behaviors**:
  * [ ] **Headers & Cells**: Rendered with diagonal grey/slate hatching (`repeating-linear-gradient`).
  * [ ] **Tooltip**: Hovering over headers or cells displays: `"These days moved to your new chart! 🚀"`.
  * [ ] **Daily Total Row**: Displays the locked dash `➖` icon with forward-hashing.
  * [ ] **Interaction**: Completely unclickable in both Normal Mode and Exception Mode.

---

### [ ] Workflow 6: Historical Week Browsing (`HISTORICAL`)
* **Objective**: Verify read-only archive browsing across past weeks.
* **Steps**:
  1. Click the **`◀ Prev Week`** button in the top navigation to view a previously completed week.
  2. Attempt to click any day header or checkbox.
  3. Check the floating `⚡ Back to Today` button.
* **Expected Visuals & Behaviors**:
  * [ ] **All Headers**: Slate Grey (`#cbd5e1`) with `not-allowed` cursor.
  * [ ] **All Cells**: Fully read-only (clicking does nothing).
  * [ ] **`⚡ Back to Today` Pill**: Hidden (since you are browsing history).
  * [ ] Clicking **`Next Week ▶`** brings you back to the current active week with all active highlights restored.

---

### [ ] Workflow 7: Retroactive Past Day Task Completion
* **Objective**: Verify catching up on tasks from yesterday with parent/child confirmation.
* **Steps**:
  1. In the current week, click a **past day header** (e.g., yesterday).
  2. In the **"Switch Day? 📅"** dialog, click **"Switch to [Day]"**.
  3. Check a task on yesterday's column.
* **Expected Visuals & Behaviors**:
  * [ ] Yesterday’s column becomes bright white and active.
  * [ ] Checking the task adds XP, plays the check sound, and updates yesterday's Daily Total star slot.
  * [ ] The `⚡ Back to Today` pill is visible to return to today at any time.

---

## 🛠️ Console Debugging Helpers

If you want to inspect resolved states in DevTools Console:
```javascript
// Get all 7 resolved column states for the currently viewed week
const colStates = dateUtils.getWeekColumnStates(window.__app_state__, window.__current_viewing_week__);
console.table(colStates);
```
