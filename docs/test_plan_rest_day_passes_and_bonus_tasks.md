# 🧪 Test & Verification Plan: Smart Hybrid Rest Day Passes, Bonus Tasks & Great Ball Lore

**Document**: `docs/test_plan_rest_day_passes_and_bonus_tasks.md`  
**Feature PRD**: [`docs/prd_rest_day_passes_and_bonus_tasks.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_rest_day_passes_and_bonus_tasks.md)  
**Version**: 2.4.0 (Responsive Viewport Policy: Zero Scroll Tablet/Desktop vs. Horizontal Scroll Mobile, Parent Command Dock, Rest Day Click Lock, 2D Great Ball Lore)  
**Schema Compatibility**: Schema V18 (Zero Database Migration Required)  
**Audience**: Product Management, QA, Engineering, Parents, Pair-Programming Agents  

---

## 🛠️ 1. Environment & Setup

* **Local App URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`).
* **Parent Admin Passcode**: `zxcv`
* **Test Runner**: `node run_headless_tests.js`
* **Browser Cache**: Perform a hard refresh (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> on Linux/Windows, <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> on Mac) to ensure Service Worker cache `poke-chart-cache-v119` and asset tags `style.css?v=10.13`, `app.js?v=10.7` are active.

---

## 📋 2. Step-by-Step Manual Validation Scenarios

### 🔄 Test 1: 3-State Direct Cycling in Exception Mode
1. Click **Admin 🔒** in the top bar.
2. Enter passcode `zxcv` and click **Submit**.
3. Inside the Parent Admin panel, click **Exception Mode ⚠️**.
4. The admin modal closes and the amber alert banner appears:  
   `⚙️ EXCEPTION EDIT MODE: Click cells to cycle (🔴 Normal ➔ ✨ BONUS ➔ 💤 REST)`
5. Pick an unexcused task cell on an active day (e.g. **Friday Writing**).
6. **Tap 1 (Normal ➔ `✨ BONUS`)**:
   - [ ] The cell transforms into a **Scheduled Elective Bonus Task**:
     - Background: Soft sky blue tint (`#f0f9ff`).
     - Affordance: Sky blue dashed circle (`3px dashed #0284c7`) with white fill and centered `✨` sparkle emoji (`16px`).
     - Classes / Attributes: `.excused-cell.bonus-cell`, `data-excused-type="bonus"`.
     - Tooltip on hover: `"Bonus Task (+10 XP if completed!)"`.
   - [ ] Friday's daily goal required task count decreases by 1 in tooltip calculation (e.g. `0 / 5` $\rightarrow$ `0 / 4`).
   - [ ] Friday's Daily Total footer cell displays the clean pending status icon **❌** (no fractional text in cell; tooltip reads `0 / 4`).
7. **Tap 2 (`✨ BONUS` ➔ `💤 REST`)**:
   - [ ] The cell transforms into a **Rest Day Pass (Life Disruption / Excused Chore)**:
     - Background: Soft diagonal stripe hatching (`repeating-linear-gradient(-45deg, #f8fafc, #f8fafc 4px, #e2e8f0 4px, #e2e8f0 8px)`).
     - Border: `none !important`.
     - Icon: Centered borderless `💤` emoji (`19px` with drop shadow `rgba(100, 116, 139, 0.35)`).
     - Classes / Attributes: `.excused-cell.rest-cell`, `data-excused-type="rest"`.
     - Tooltip on hover: `"Rest Day (Excused chore)"`.
     - Exception Mode Affordance: Pointer cursor is active to allow cycling back to Normal.
   - [ ] Friday's required task denominator remains reduced (`0 / 4` in tooltip).
8. **Tap 3 (`💤 REST` ➔ `🔴 Normal`)**:
   - [ ] The cell reverts back to a normal interactive red-and-white Pokéball (`🔴`).
   - [ ] Friday's required chore count restores to full (`0 / 5` in tooltip).
9. Click **Done ✅** in the amber banner to exit Exception Mode.

---

### ⭐ Test 2: Scheduled Elective Task (`✨ BONUS`) Overachiever Completion & Authentic Great Ball
1. Enter Exception Mode and set **Monday Writing** to **`✨ BONUS`** (Tap once). Exit Exception Mode.
2. Ensure Monday is the active column (or click Monday's header to switch to it).
3. Ensure Weekly and Mega rewards are selected so checks are permitted.
4. Note your active Pokémon partner's XP (e.g. Pikachu at `30 XP`).
5. **Complete Required Chores**: Check the 4 required tasks (Piano, Math, Reading, Chinese).
   - [ ] The Daily Star unlocks into the Star Vault!
   - [ ] Star chime plays, and Monday's footer displays the unlocked gold Daily Star icon **🌟**.
   - [ ] *Child Readability Invariant*: Cell displays **only** the star icon (zero numbers in cell; parent tooltip displays `4 / 4 ⭐ Complete!`).
6. **Complete the Elective Chore (Great Ball Transformation)**: Now click the **`✨ BONUS`** Writing task.
   - [ ] The cell transforms into an authentic **Great Ball (Super Ball)**:
     - Upper Dome: Royal Cobalt Blue dome (`#2563eb`).
     - Red Elements: Two diagonal pill bars (`#ef4444` core, `#2d3748` outline) angled ~45° toward center with rounded ends.
     - Center Mechanism: Equator band with dark charcoal contour (`#2d3748`) and golden yellow center button (`#ffcb05`).
     - Lower Dome: Pure white (`#ffffff`) with subtle bottom crescent shadow (`#e2e8f0`).
     - Glow: Vibrant blue aura (`box-shadow: 0 0 10px rgba(37, 99, 235, 0.45)`).
     - Floating Badge: Snug **`+XP`** badge at `top: -6px; right: -2px` in dark blue (`#1d4ed8`) with white text.
   - [ ] **Floating XP Notification**:
     - Animates smoothly above the Great Ball: **`+10 XP Super Trainer! 🚀`**.
     - Typography: High-contrast `'Fredoka One', cursive, sans-serif` font with dark outlines.
     - Dwell Time: Holds steady for **1.5s+** (total 2.5s duration) before fading, giving early readers comfortable time to parse.
     - Clamping: Remains fully visible and clamped within screen boundaries (no clipping on Monday or mobile edges).
   - [ ] Active partner XP increases by exactly **+10 XP** (e.g. `30 XP` $\rightarrow$ `40 XP`).
   - [ ] Monday's Daily Total footer star **🌟** triggers a celebratory glowing gold pulse animation (`.super-trainer`), while keeping the cell free of raw numbers.
   - [ ] Tooltip on hover displays full overachiever breakdown: `5 / 4 ⭐ (Super Trainer! 🚀)`.
7. **Accidental Unchecking**: Click the completed Great Ball Writing task again to uncheck it.
   - [ ] Cell reverts cleanly to unchecked `✨` cyan dashed circle.
   - [ ] Partner XP decrements cleanly by 10 XP (`40 XP` $\rightarrow$ `30 XP`).
   - [ ] Monday's footer stops pulsing (`.super-trainer` removed) and retains the standard gold Daily Star **🌟** (tooltip `4 / 4 ⭐ Complete!`).
   - [ ] **Critical Invariant**: The already-earned Daily Star remains safely in the Star Vault (NOT revoked).

---

### 💤 Test 3: Rest Day Pass (`💤 REST`) — Non-Clickable Child Protection & Star Relief
1. Enter Exception Mode and set **Wednesday Piano** to **`💤 REST`** (Tap twice). Exit Exception Mode.
2. Switch active day to Wednesday.
3. **Verify Rest Cell Non-Clickable Lock (Child Mode)**:
   - [ ] Cell shows soft diagonal stripe hatching with centered borderless `💤` emoji.
   - [ ] Hovering over the cell displays cursor `default` (no pointer hand, no button hover lift, no shadows).
   - [ ] Hover tooltip reads `"Rest Day (Excused chore)"`.
   - [ ] Underlying checkbox is explicitly disabled (`disabled` attribute, `pointer-events: none`).
   - [ ] **Click the `💤` cell**: Nothing happens! Checkbox remains unchecked and disabled; does **NOT** check the chore, does **NOT** morph into a Great Ball, and does **NOT** award XP.
4. **Complete Remaining Required Chores (Relief Goal)**:
   - [ ] Complete the 4 remaining required tasks (Math, Reading, Writing, Chinese).
   - [ ] Daily Star unlocks into the Star Vault with celebratory star chime!
   - [ ] Wednesday's Daily Total footer displays the gold Daily Star icon **🌟** (tooltip reads `4 / 4 ⭐ Complete!`).
5. **Click Lock Remains Enforced After Daily Star Earned**:
   - [ ] Click the `💤` cell again after unlocking the Daily Star: Still completely non-clickable.
   - [ ] Confirms Great Balls are reserved exclusively for elective Bonus Tasks (`✨ BONUS`), never rest day passes.

---

### 🛡️ Test 4: "No-Cheating" Guardrail (Prerequisite Invariant)
1. Pick a day with 1 excused task (e.g. Wednesday with Piano as `✨ BONUS`, leaving 4 required tasks).
2. Check 3 of the required tasks (Math, Reading, Chinese).
3. Leave the 4th required task (Writing) **UNCHECKED**.
4. Now check the elective Piano bonus task (1 bonus completed $\rightarrow$ Great Ball renders!).
5. **Verify**:
   - [ ] Active partner XP increases by +10 XP with floating `+10 XP` notification.
   - [ ] Total tasks checked is 4, BUT:
   - [ ] Wednesday Daily Total cell displays locked incomplete icon **❌** (clean icon only, no numbers; tooltip reads `3 / 4 (+1)`).
   - [ ] The Daily Star is **NOT** awarded into the Star Vault.
   - [ ] *Invariant*: An elective bonus task cannot substitute for an uncompleted required chore.
6. Now check the remaining required chore (Writing).
   - [ ] All 4 required chores are now checked.
   - [ ] Daily Star unlocks with chime and gold star **🌟** into Star Vault!
   - [ ] Wednesday Daily Total star **🌟** triggers the `.super-trainer` golden pulse (tooltip updates to `5 / 4 ⭐ (Super Trainer! 🚀)`).

---

### 🚀 Test 5: The Smart Rollover Rule (Auto-Carryover vs. Auto-Expiration)
1. In Exception Mode:
   - Set **Monday Writing** to **`✨ BONUS`** (structural habit: Kepler only writes on weekends; weekdays are elective).
   - Set **Wednesday Piano** to **`💤 REST`** (temporary life pass: sick or traveling this Wednesday).
2. Exit Exception Mode.
3. Trigger a weekly rollover:
   - Either complete the week and claim the weekly badge, OR
   - From Admin 🔒, click **Reset Week Grid** and confirm rollover.
4. **Verify in the NEW Week**:
   - [ ] **Monday Writing AUTOMATICALLY CARRIES OVER**: Monday Writing in the new week is already configured as **`✨ BONUS`** (cyan dashed ring `✨`). No parent reconfiguration required!
   - [ ] **Wednesday Piano AUTOMATICALLY EXPIRES**: Wednesday Piano in the new week has reverted to a normal required Pokéball (`🔴`). The temporary rest pass did NOT contaminate the new week!

---

### ⚙️ Test 6: Manual Reset & Carry-Over Invariants
1. Set exceptions on the current week (`✨ BONUS` on Monday, `💤 REST` on Wednesday).
2. In Admin 🔒, click **Reset Week Grid**.
3. In the confirmation dialog:
   - **With "Carry over exceptions" CHECKED**: Click Reset $\rightarrow$ All checkmarks clear, but both exceptions (`✨ BONUS` and `💤 REST`) remain intact on the grid.
   - **With "Carry over exceptions" UNCHECKED**: Click Reset $\rightarrow$ All checkmarks clear AND all exceptions are wiped for a fresh clean slate.

---

### 📊 Test 7: Goal Column Integrity
1. Look at the rightmost **GOAL** column on the grid.
2. For an activity with 1 day excused out of 7 (e.g. Piano has 1 rest pass):
   - [ ] Target denominator displays **`0 / 6`** (reflecting $7 - 1 = 6$ required sessions).
3. If Kepler completes 6 required sessions + 1 bonus session ($6 + 1 = 7$):
   - [ ] Cell displays **`7 / 6 ⭐`** (or `6 / 6 Complete`).
   - [ ] Contributes cleanly toward Weekly Badge eligibility.

---

### 👶 Test 8: Child Readability Verification (Zero Raw Numbers in Daily Totals)
1. Inspect the **Daily Total** row across all 7 day columns on desktop, tablet, and mobile.
2. **Verify Clean Status Icons**:
   - [ ] Incomplete days display strictly **`❌`** (`.badge-indicator`).
   - [ ] Completed days display strictly **`🌟`** (`.badge-indicator.unlocked`).
   - [ ] Overachiever bonus days display the pulsating gold star **`🌟`** (`.badge-indicator.unlocked.super-trainer`).
   - [ ] Superseded / forward-hashed days display strictly **`➖`** (`.badge-indicator`).
3. **Verify Complete Absence of Raw Numbers in DOM**:
   - [ ] No `.day-total-count` DOM elements exist under `.day-total-cell` (asserted via Test 72).
   - [ ] No fractional strings like `0 / 4`, `3 / 4`, `4 / 4 ⭐`, `5 / 4 ⭐`, or `2 / 3 (+1)` are visible on screen to confuse a 7-year-old.
4. **Verify Parent Tooltip Accessibility**:
   - [ ] Hovering (or long-pressing on touch devices) over any `.day-total-cell` reveals the full explanatory breakdown in the browser tooltip (`title` attribute), preserving diagnostic visibility for parents.

---

### ⏱️ Test 9: Floating XP Animation, Dwell Time & Clamping Verification
1. Click a normal required task on Monday:
   - [ ] Floating XP notification displays **`+20 XP! 🎉`** in high-contrast `'Fredoka One'` font.
   - [ ] Dwell Phase: Notification rises slightly and holds motionless for **1.5s+** (total duration **2.5s**) before gently dissolving.
   - [ ] Edge Clamping: Notification does not clip against the left edge of the viewport.
2. Click an elective bonus task:
   - [ ] Floating XP notification displays **`+10 XP Super Trainer! 🚀`** (or `+10 XP` if before daily goal) without nested parentheses.
   - [ ] Dwell Phase: Holds steady for **1.5s+** before fading.
3. Test on Mobile Viewport (412px width):
   - [ ] Ensure floating XP elements stay entirely within the visible viewport bounds on edge columns.

---

## 🤖 3. Automated Headless Test Suite Invariants

Run the headless regression test suite directly in bash:
```bash
node run_headless_tests.js
```

### Automated Invariants Tested:
* **Test 17**: 3-State cycling in Exception Mode (Normal $\rightarrow$ Bonus $\rightarrow$ Rest $\rightarrow$ Normal) and retention through completed states.
* **Test 68**: Rest Day Pass activation (`💤 REST`), verification that rest checkboxes are disabled and non-clickable in child mode (`assert(pianoRestCb.disabled)`, `pianoRestCb.click()` rejected), Daily Star award upon 4 required chores, Overachiever `+10 XP` on bonus chores, `.super-trainer` pulse class, assertion that `.day-total-count` DOM element is NOT present, accidental uncheck protection, and no-cheating guardrail.
* **Test 69**: PWA backward-compatibility export stubs (`applyBackup`, `saveAutoBackup`, `getBackupHistory`).
* **Test 70**: Child profile modal lifecycle and button state reset.
* **Test 71**: Unearned weekly badge and reward carry-over across week rollover.
* **Test 72**: Smart Hybrid 3-State Exception Mode cycling, UI attributes, Overachiever +10 XP, and Smart Rollover auto-carryover (`✨ BONUS`) vs. auto-expiration (`💤 REST`).
* **Test 73**: Parent Command Dock floating UI verification, semantic elements (`.exceptions-mode-badge`, `.exceptions-legend`, `.exceptions-done-btn`), computed `position: fixed`, `z-index: 998`, `96px` container bottom clearance padding, and `Escape` key dismissal.
* **Test 74**: Responsive Viewport Policy verification: Zero horizontal scroll enforced on Desktop/Tablet ($\ge 768\text{px}$) via `overflow-x: hidden` and `table-layout: fixed`; horizontal scroll enabled on Mobile ($< 768\text{px}$) via stylesheet rule `@media (max-width: 767px)` with `overflow-x: auto`, `min-width: 620px`, and comfortable touch padding (`padding: 8px 3px`).

**Pass Criteria**: **74/74 tests passing with 0 failures.**

---

## 🏁 4. Sign-Off Checklist
- [ ] Test 1: Exception Mode 3-state cycling verified (`Normal ➔ Bonus ➔ Rest ➔ Normal`).
- [ ] Test 2: `✨ BONUS` overachiever completion renders authentic 2D Great Ball (blue dome, diagonal red pills, yellow button, white base, `+XP` badge), 2.5s readable XP float animation, and pulses `.super-trainer` star in footer.
- [ ] Test 3: `💤 REST` non-clickable child lock verified (disabled checkbox, zero button affordance, cannot be checked/turned into Great Ball) and Daily Star unlocks upon completing required chores.
- [ ] Test 4: No-cheating guardrail verified (3 required + 1 bonus does not unlock Star; footer displays `❌`).
- [ ] Test 5: Smart Rollover verified (`✨ BONUS` auto-carries over; `💤 REST` auto-expires).
- [ ] Test 6: Manual reset carry-over checkbox verified.
- [ ] Test 7: Goal column denominator calculation verified.
- [ ] Test 8: Child readability verified (clean `🌟`, `❌`, `➖` icons only; fractional counts accessible via parent hover tooltip).
- [ ] Test 9: Floating XP animation timing (2.5s duration, 1.5s dwell phase) and screen edge clamping verified.
- [ ] Test 10: Parent Command Dock verified (floats at bottom center during Exception Mode without colliding with sticky top Mini-HUD, `Escape` key dismisses, 96px bottom clearance protects page footer).
- [ ] Test 11: Responsive Viewport Policy verified: Zero horizontal scroll on tablet/desktop ($\ge 768\text{px}$), horizontal scroll enabled on mobile ($< 768\text{px}$) with `min-width: 620px` and no overlapping Pokéball cells.
- [ ] Automated suite: `node run_headless_tests.js` passes 74/74 tests (100%).
