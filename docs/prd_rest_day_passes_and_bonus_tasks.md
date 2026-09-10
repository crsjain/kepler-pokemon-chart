# Product Requirement Document (PRD): Rest Day Passes, Bonus Tasks & Icon State System

**Document**: `docs/prd_rest_day_passes_and_bonus_tasks.md`  
**Version**: 2.1.0 (Rest Day Click Lock & Exclusive Bonus Task Great Ball Specification)  
**Schema Compatibility**: Schema V18 (Zero Database Migration Required)  
**Status**: Implemented & Approved  
**Audience**: Product Management, UX Design, Game Design, Engineering (Jetski Assistant)  
**Target Users**: Kepler (7yo), Lyra, and Parents  
**Companion Standards**: [`docs/prd_column_state_machine.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_column_state_machine.md), [`_agents/rules/ux-guidelines.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/rules/ux-guidelines.md)

---

## 1. Executive Summary & Problem Statement

### 1.1. Context & Evolution
In Kepler's Pokémon Chart, daily academic and habit tasks (Piano, Math, Reading, Writing, Chinese, Jiu-Jitsu) are tracked across a 7-day schedule to earn daily stars for the Star Vault.

To adapt to real-world family life (travel, sick days, alternating school schedules, and enrichment), the chart distinguishes between **Relief (Rest Day Passes)** and **Enrichment (Bonus Tasks)**.

### 1.2. Key UX Challenge: Icon State Clarity for a 7-Year-Old
In earlier versions, uncompleted rest days and completed bonus balls looked too similar to interactive buttons or standard Pokéballs. Kepler experienced confusion over:
1. **False Button Affordances**: Rest days had circular outlines or clickable checkboxes that made them look like chores that still needed to be completed, or would accidentally show a Great Ball if clicked.
2. **Ambiguous Completion**: Completed bonus tasks needed an authentic, celebrated Pokémon identity distinct from normal dormants.
3. **Column Width Shifts**: Early badge treatments caused table columns to stretch or trigger horizontal scrollbars on tablets.

### 1.3. The Solution: Option 2 "Great Ball" System with Non-Clickable Rest Days
We implemented a strict, unambiguous 5-archetype visual hierarchy:
- **Normal Tasks**: Classic Red/White Pokéball (🔴).
- **Rest Days (`💤`)**: **Floating, borderless & strictly non-clickable** on diagonal stripes—disabled input, `pointer-events: none`, `cursor: default`, zero button affordance.
- **Bonus Tasks (`✨`)**: Vibrant **cyan dashed ring** (`#0284c7`) on soft sky blue cell. Clickable for enrichment.
- **Completed Bonus Tasks**: Authentic **Great Ball (Super Ball)** exclusively for completed bonus tasks, with Cobalt Blue dome, dual sculpted scarlet red shoulder tabs at 10 & 2 o'clock, concentric white button, and a snug **`+XP`** badge.
- **Zero Horizontal Scrolling**: Strict 36px circular footprint across all viewports.

---

## 2. Comprehensive Task State & Icon Color Matrix

The following table is the authoritative reference for all task states, CSS classes, rendering methods, and hex color codes.

| State # | State Name | Trigger / Context | Cell CSS Classes | DOM Structure | Icon Visual & Color Specification | Reward / Game Effect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Normal Unchecked** | Standard required chore, not yet done today | `.checkbox-cell` | `<span class="pokeball"></span>` | • **Outer Border**: `3px solid #2d3748`<br>• **Upper Dome**: Dormant Grey (`#cbd5e0`)<br>• **Dividing Line**: `3px solid #2d3748`<br>• **Center Button**: White circle with `3px solid #2d3748`<br>• **Lower Dome**: Pure White (`#ffffff`) | None (pending completion) |
| **2** | **Normal Checked** | Standard required chore completed | `.checkbox-cell` | `input:checked + .pokeball` | • **Outer Border**: `3px solid #2d3748`<br>• **Upper Dome**: Pokémon Red (`#ff3c3c` / `var(--poke-red)`)<br>• **Dividing Line**: `3px solid #2d3748`<br>• **Center Button**: Pokémon Yellow (`#ffcb05` / `var(--poke-yellow)`)<br>• **Lower Dome**: Pure White (`#ffffff`)<br>• **Check FX**: `wiggle` 0.4s ease | Counts toward Daily Star (e.g., `1 / 4`) |
| **3** | **Rest Day (Non-Clickable)** | Excused task set by parent (sick/travel/relief) | `.checkbox-cell.excused-cell.rest-cell` | `<input type="checkbox" disabled>` + `<span class="pokeball"></span>` | • **Affordance**: Strictly non-clickable in child mode (`pointer-events: none; cursor: default;`)<br>• **Border**: `none !important`<br>• **Background**: Transparent (shows diagonal striped cell)<br>• **Icon**: Centered `💤` emoji (`19px`, `filter: drop-shadow(0 2px 4px rgba(100, 116, 139, 0.35))`)<br>• **Cell Background**: `repeating-linear-gradient(-45deg, #f8fafc, #f8fafc 4px, #e2e8f0 4px, #e2e8f0 8px)` | Lowers daily goal (e.g. `5/5` ➔ `4/4 ⭐`). Zero penalty. Cannot be checked or turned into a Great Ball. |
| **4** | **Bonus Task (Unchecked)** | Extra enrichment opportunity | `.checkbox-cell.excused-cell.bonus-cell` | `input:not(:checked) + .pokeball` | • **Border**: `3px dashed #0284c7` (Sky Blue dashed ring)<br>• **Background**: `#ffffff`, `border-radius: 50%`<br>• **Shadow**: `0 2px 4px rgba(2, 132, 199, 0.2)`<br>• **Icon**: Centered `✨` sparkle emoji (`16px`)<br>• **Cell Background**: Soft Sky Blue tint (`#f0f9ff`)<br>• **Affordance**: Interactive (`cursor: pointer`), hover lift | Optional chore; zero penalty if skipped |
| **5** | **Great Ball (Bonus Completed)** | Child completes an elective bonus task | `.checkbox-cell.excused-cell.bonus-cell` | `input:checked + .pokeball` + `::after` badge | • **Icon**: Authentic **Great Ball** SVG vector (see Section 3)<br>• **Cell Background**: Soft Sky Blue tint (`#f0f9ff`)<br>• **Badge**: Floating `+XP` pill at `top: -6px; right: -2px`<br>• **Glow**: `box-shadow: 0 0 10px rgba(37, 99, 235, 0.45)` | Awards `+10 XP` to active partner Pokémon; unlocks `(Super Trainer! 🚀)` footer |
| **6** | **Superseded / Forward-Hashed** | Date range forwarded to new week cycle | `.checkbox-cell.superseded-cell.excused-cell` | `.pokeball` (disabled) | • **Cell Background**: Dense diagonal stripes (`-45deg, #f8fafc ... #e2e8f0 12px`)<br>• **Border**: `3px solid #94a3b8`<br>• **Icon**: Muted grey star `★` (`color: #64748b; opacity: 0.45`)<br>• **Badges**: Strictly hidden (`display: none !important;`)<br>• **Cursor**: `not-allowed`, `opacity: 0.55` | Read-only archive; no interaction |
| **7** | **Out-of-Range** | Task created after or deleted before this date | `.checkbox-cell.out-of-range-cell` | `.pokeball` (disabled) | • **Cell Background**: Solid grey `#f1f5f9`<br>• **Pokéball**: Dormant, dimmed (`opacity: 0.35`)<br>• **Cursor**: `not-allowed` | Inactive |

---

## 3. Great Ball (Super Ball) Design Specification

To faithfully mirror official Pokémon media (Game Freak / Pokémon GO / 3D model reference):

```
                      +XP [Pill Badge: top: -6px; right: -2px]
                   .  -- ~~~ --  .
               .-~        |        ~-.
            .-~  [RED]    |    [RED]  ~-.     <-- Dual sculpted visor pads (10 & 2 o'clock)
          /       TAB     |     TAB       \       (Top: #ef4444, Base: #b91c1c)
         /     (10:00)    |    (2:00)      \
        |=================(O)===============|   <-- Dark band (#2d3748) + White button
        |                                   |
         \             [ PURE ]            /
          \            [WHITE ]           /
            ~-.        [BOTTOM]        .-~
                ~- .      |      . -~
                     ~ - ... - ~
```

### 3.1. Vector SVG Architecture
The Great Ball is rendered dynamically via inline SVG background on `.checkbox-cell.bonus-cell input:checked + .pokeball`:
```css
.checkbox-cell.bonus-cell:not(.superseded-cell) input:checked + .pokeball {
  position: absolute !important;
  top: 0 !important; left: 0 !important;
  width: 36px !important; height: 36px !important;
  border: none !important;
  border-radius: 50% !important;
  background-color: transparent !important;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36' width='36' height='36'%3E%3Ccircle cx='18' cy='18' r='16.5' fill='%23ffffff' stroke='%232d3748' stroke-width='3'/%3E%3Cpath d='M 3 20.5 A 16.5 16.5 0 0 0 33 20.5 A 15.2 13.8 0 0 1 3 20.5 Z' fill='%23e2e8f0'/%3E%3Cpath d='M 1.5 18 A 16.5 16.5 0 0 1 34.5 18 Z' fill='%232563eb'/%3E%3Cline x1='1.5' y1='18' x2='34.5' y2='18' stroke='%232d3748' stroke-width='3'/%3E%3Cline x1='8.8' y1='9.2' x2='13.2' y2='13.6' stroke='%232d3748' stroke-width='5' stroke-linecap='round'/%3E%3Cline x1='8.8' y1='9.2' x2='13.2' y2='13.6' stroke='%23ef4444' stroke-width='2.6' stroke-linecap='round'/%3E%3Cline x1='27.2' y1='9.2' x2='22.8' y2='13.6' stroke='%232d3748' stroke-width='5' stroke-linecap='round'/%3E%3Cline x1='27.2' y1='9.2' x2='22.8' y2='13.6' stroke='%23ef4444' stroke-width='2.6' stroke-linecap='round'/%3E%3Ccircle cx='18' cy='18' r='6' fill='%232d3748'/%3E%3Ccircle cx='18' cy='18' r='4.2' fill='%23ffcb05'/%3E%3C/svg%3E") !important;
  background-size: contain !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
  box-shadow: 0 0 10px rgba(37, 99, 235, 0.45) !important;
  display: block !important;
  cursor: pointer;
}
```

### 3.2. Geometric Components
1. **Outer Boundary**: Circle `r=16.5` at `(18, 18)` with `stroke="#2d3748" stroke-width="3"`.
2. **Lower Hemisphere & Crescent Shadow**: Pure white (`#ffffff`) lower half with a subtle bottom crescent shadow path (`#e2e8f0`) along the base.
3. **Blue Upper Dome**: Semicircular path `M 1.5 18 A 16.5 16.5 0 0 1 34.5 18 Z` filled with Royal Cobalt Blue (`#2563eb`).
4. **Dual Angled Red Pill Elements**:
   - Two diagonal rounded pill bars angled downward toward the center button (~45°).
   - Left pill: Line from `(8.8, 9.2)` to `(13.2, 13.6)`. Outlined in `#2d3748` (`stroke-width="5" stroke-linecap="round"`) with inner red core `#ef4444` (`stroke-width="2.6" stroke-linecap="round"`).
   - Right pill: Line from `(27.2, 9.2)` to `(22.8, 13.6)`. Outlined in `#2d3748` (`stroke-width="5" stroke-linecap="round"`) with inner red core `#ef4444` (`stroke-width="2.6" stroke-linecap="round"`).
5. **Equator Band & Center Mechanism**:
   - Equator line: `x1=1.5, y1=18` to `x2=34.5, y2=18` with `stroke="#2d3748" stroke-width="3"`.
   - Outer Button Ring: Circle `r=6` filled with `#2d3748`.
   - Inner Button: Circle `r=4.2` filled with Golden Yellow (`#ffcb05`).
6. **Floating `+XP` Badge**:
   - Rendered via `.pokeball-checkbox:has(input:checked)::after`.
   - Dimensions: Compact pill (`font-size: 7px; padding: 1px 3px; border-radius: 4px; line-height: 1`).
   - Position: `top: -6px; right: -2px`.
   - Colors: Background `#1d4ed8`, border `1px solid #1e3a8a`, text `#ffffff`.

---

## 4. Parent Exception Mode (3-State Cycling)

Parents configure task exceptions directly on the weekly grid during Exception Mode (`Admin 🔒 ──► zxcv ──► Exception Mode ⚠️`):

```
        ┌────────────────────────────────────────────────────────┐
        │        PARENT EXCEPTION MODE 3-STATE CYCLE             │
        └────────────────────────────────────────────────────────┘

            [ 1. Normal Task ] (Standard Pokéball)
                   │
                   ▼ (Click 1)
            [ 2. Bonus Task ] (✨ Cyan Dashed Ring)
                   │  • state.excused[key] = 'bonus'
                   │  • data-excused-type = 'bonus'
                   │
                   ▼ (Click 2)
            [ 3. Rest Day Pass ] (💤 Borderless)
                   │  • state.excused[key] = 'rest'
                   │  • data-excused-type = 'rest'
                   │
                   ▼ (Click 3)
            [ 1. Normal Task ] (Reverts to standard chore)
                      • delete state.excused[key]
```

### 4.1. Smart Rollover Policy
- **Bonus Tasks (`'bonus'`)**: Represent ongoing curriculum / elective enrichments (e.g. Piano on Saturday). They **automatically carry over** to subsequent weeks during rollover.
- **Rest Day Passes (`'rest'`)**: Represent temporary physical relief (illness, holiday, travel). They **automatically expire** upon week rollover so chores naturally return to standard requirements.
- **Manual Carryover Flag**: If `carryOver: true` is explicitly passed in code, both types carry over.

---

## 5. Technical Constraints & Invariants

1. **Strict 36px Footprint**: All icons (Pokéball, borderless `💤`, dashed `✨`, Great Ball) occupy exactly `36px × 36px`.
2. **Zero Horizontal Scroll**: The grid table must maintain `table-layout: fixed; width: 100%;` with `0px` scroll delta across all 5 responsive test viewports (1280×800 desktop down to 412px mobile).
3. **No Cheating on Daily Stars**: Completing bonus tasks never substitutes for incomplete required chores.
4. **XP Deductibility**: Unchecking a bonus task cleanly decrements `10 XP` without corrupting star vault records.
5. **Regression Verification**: All 72 automated test cases in `run_headless_tests.js` must pass 100% green before any release.
6. **Child-Friendly Daily Totals (No Number Parsing)**: The Daily Total row displays only the visual status icons (❌ for incomplete days, 🌟 for complete days, with glowing pulse for Super Trainer bonus days, and ➖ for superseded days). Fractional task counts (e.g. `1 / 3 (+1)`, `0 / 0 ⭐`) are omitted from the visual layout so a 7-year-old child can instantly parse their progress without cognitive overload. Full counts remain accessible via hover tooltips for parents.
