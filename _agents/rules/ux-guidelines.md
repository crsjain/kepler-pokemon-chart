# Kepler Pokémon Chart UX/UI Guidelines

This document outlines core UX principles and styling constraints for Kepler Pokémon Chart development. Follow these rules to avoid common layout bugs and ensure accessibility.

## 1. Avoid Class Layout Pollution
Never re-use dense layout classes (like `.admin-task-item`) for lighter inline items without fully resetting or overriding their layout properties (especially `flex-direction`, `align-items`, and `padding`). Prefer creating a distinct class (e.g., `.reward-list-item`) to keep layout styles isolated and predictable.

## 2. Horizontal Layout for Action Lists
List rows containing a text label and an action (like "Delete" or "Edit") must be aligned horizontally (`flex-direction: row; justify-content: space-between; align-items: center;`) to preserve vertical space and maintain a clean scan-line for the user.

## 3. High-Contrast Icons
For lists with action buttons (like delete or settings), prefer compact, high-contrast monochrome SVG icons (e.g., solid white `#ffffff` on colored backgrounds) instead of system emojis or text buttons. Emojis render inconsistently across operating systems and fail WCAG contrast rules on bright button backgrounds.

## 4. Multi-Column Dashboard Modals on Desktop
When editing dual or multi-column data structures inside modal dialogs (like Weekly and Mega Milestone Rewards), avoid tall scrolling cards. Optimize the space for desktop screens:
- Lock the modal body width to `max-width: 1000px` (or `90%`) and height to `height: 80vh;` with `overflow: hidden` on the modal content.
- Align columns side-by-side using CSS Grid (`grid-template-columns: 1fr 1fr;` on desktop, falling back to `1fr` on tablet/mobile).
- Set `min-width: 0` on the grid column panels to allow nested flex elements to properly compute truncation width boundaries.
- Ensure only the list arrays internally scroll vertically (`flex-grow: 1; min-height: 0; overflow-y: auto;`), locking the headers and inputs to the top and bottom of the pane.

## 5. Keep Scrollbar Tracks Transparent for Rounded Containers
When using rounded border radii (`border-radius`) on scrolling panels or containers (such as `.modal-content`), never leave custom or system scrollbar tracks with solid background fills. A solid fill track will overlap and flatten the rounded corners. Make scrollbar tracks transparent (`background: transparent`) so the rounded container boundaries clip correctly.

## 6. Hold-to-Unlock / Gesture Buttons
For critical or high-value actions (like spending currency, unlocking permanent items, or irreversible operations), prefer a hold-to-unlock gesture button over a simple click button.
- Include a high-contrast circular or linear progress indicator that fills up smoothly over a duration (e.g., 2-3 seconds) with `transition: stroke-dashoffset 0.1s linear`.
- Prevent accidental clicks by binding hold progress to `mousedown`/`touchstart` and resetting it on `mouseup`/`mouseleave`/`touchend`/`touchcancel`.
- Show a clear disabled state when requirements are not met: disable the button, hide the progress SVG indicator, and display a helpful label explaining the requirement (e.g., "Earn 3 more stars!").

## 7. Responsive Filter and Control Bars
Horizontal filter bars or control rows containing multiple components (e.g., dropdowns, inputs, checkboxes, clear buttons) must wrap cleanly on smaller viewports.
- Set `flex-wrap: wrap; gap: 8px; justify-content: center;` on the container.
- Do not use fixed-pixel widths for input controls inside responsive bars; use flexible widths (`flex: 1` or percentage-based width) so items expand to fill wrapped rows on mobile screens.

## 8. Zero Inline Styles for Modal Containers
Never use inline `style="..."` attributes on modal wrappers, inner views, filter bars, or grids. Keep all layouts, dimensions, media queries, and height/scrolling properties isolated inside classes in `style.css` to maintain theme consistency and allow responsive scaling. Ensure that content boxes have scrollable behavior (`overflow-y: auto; max-height: 100%`) so that low-height viewports (like mobile landscape mode) can reach all action buttons without cutoff.

## 9. Visual Affirmation and Unlock Highlights
When executing critical actions that update active selections or unlock permanent collection assets (like purchasing or evolving a partner Pokémon), apply clear and immediate visual feedback on the main layout. For example, apply a temporary scaling animation (`transform: scale(...)`) or a highlight outline on the newly unlocked partner block, ensuring that children receive instant, delightful validation of their achievement.

## 10. Avoid Awkward Text Wrapping in Buttons and Labels
For buttons or labels containing long descriptive text, subtext, or emojis, prevent awkward single-word or single-character wrapping (especially orphan emojis or brackets).
- Use `white-space: normal` combined with structural elements (like `<br>` or `display: block` on nested spans) to split the text into logical rows (e.g., primary action on top, subtext/requirements on bottom).
- When using dynamic subtext inside buttons, wrap the subtext in a span with a slightly smaller font size (e.g., `0.85rem` or `0.9em`) to create a clear visual hierarchy and ensure it fits comfortably.
- Avoid inline styles for formatting these wraps; use semantic class names (e.g., `.subtext`) and define their layout in `style.css`.


## 11. Tonal Matching & Action-Oriented CTA Microcopy
For modal notifications or alert dialogs, the primary action or confirmation button (CTA) must match the emotional tone and context of the event:
- **Positive Milestones / Achievements** (e.g., Level Up, Unlock, Claiming Rewards): Use celebratory copy (e.g., `"Awesome!"`, `"Woohoo! 🎉"`) and high-excitement brand colors (like bright yellow/gold).
- **Warnings / Setbacks / System Alerts** (e.g., Devolution, Validation Errors, Task Unchecking): Avoid celebratory language. Use neutral, action-oriented, or motivational microcopy (e.g., `"Let's get it back! 🚀"`, `"I'll train harder! 💪"`, or `"Got it"`) and style the button in a neutral or warning color (like slate-blue, gray, or orange) to provide correct feedback.

## 12. Standardized Spacing Rhythm & Shadow Compensation for Tactile UI
When using tactile 3D elements with physical drop shadows (e.g., `.pixel-btn` with `box-shadow: 0 4px 0`), always design layouts using pure CSS flex/grid `gap` rather than child `margin`:
- **Never Mix Margin with Flex Gap**: Do not add inline `margin-top` or `margin-bottom` to child elements inside containers that declare a `gap`. This causes compounding double-margin bugs.
- **Shadow Compensation**: Because a `0 4px 0` box-shadow renders outside the element's layout flow, stacked buttons require a container `gap: 10px` to `12px` to preserve a comfortable `6px` to `8px` perceived optical whitespace.
- **Zero Inline Dimensions on Form Elements**: Form inputs and buttons inside action groups must use `width: 100%; margin: 0;` declaratively in `style.css` instead of inline `style="..."` attributes.


## 13. Weekly Grid Column State & Visual Hierarchy (Header & Cell Treatments)
The Weekly Training Grid uses a centralized state machine with 4 distinct chromatic archetypes to clearly communicate temporal status, interaction affordance, and administrative overrides across both Kids (training mode) and Parents (exception/admin mode):

### A. Chromatic Archetypes & State Visual Pairing
1. **Active Training Column (`ACTIVE_TODAY`, `ACTIVE_PAST`, `ACTIVE_FUTURE`)**:
   - **Header**: Pikachu Yellow (`#ffcb05`), Dark Charcoal Text (`#1e293b`), `cursor: default`.
   - **Cells**: Full Opacity (1.0), Solid White background (`#ffffff`), fully interactive Pokéballs and glowing ⭐ daily totals.
   - **Intent**: High visual focus drawing Kepler & Lyra directly to the current day's tasks.
2. **Selectable Unselected Column (`SELECTABLE_TODAY`, `SELECTABLE_PAST`)**:
   - **Header**: Poké Blue (`#2a71d0`), Solid White Text (`#ffffff`), hover lift, `cursor: pointer`.
   - **Cells**: Soft Dimming (0.45 Opacity), `pointer-events: none` on cells in normal mode to prevent accidental checks without switching columns.
   - **Intent**: Inactive day available to switch to. `SELECTABLE_TODAY` switches with zero modal; `SELECTABLE_PAST` prompts with "Switch Day? 📅" modal.
3. **Future Locked Column (`FUTURE_LOCKED`)**:
   - **Header**: Neutral Slate Grey (`#cbd5e1`), Muted Slate Text (`#64748b`), `cursor: not-allowed`, no hover color change.
   - **Cells**: Soft Grey background (`#f1f5f9`), 0.8 Opacity on Pokéballs, checkbox inputs disabled in normal mode.
   - **Intent**: Upcoming days locked for kids, but editable by parents in Exception Mode (Scenario 10).
4. **Superseded / Forward-Hashed Column (`SUPERSEDED`)**:
   - **Header**: Diagonal Stripe Gradient (`repeating-linear-gradient(-45deg, #cbd5e1, #cbd5e1 6px, #94a3b8 6px, #94a3b8 12px)`), Slate Text (`#475569`), `cursor: not-allowed`, tooltip `"These days moved to your new chart! 🚀"`.
   - **Cells**: Soft Diagonal Stripe Hatching (`-45deg, #f8fafc ... #e2e8f0`), Grayscale hatched Pokéballs, Daily total shows muted `➖`, strictly non-editable across all modes.
   - **Intent**: Truncated dates forwarded to a new week cycle (Case A / Case B shifts).
5. **Historical Completed Week (`HISTORICAL`)**:
   - **Header**: Neutral Slate Grey (`#cbd5e1`), Slate Text (`#64748b`), `cursor: not-allowed`.
   - **Cells**: Dimmed (0.45 Opacity), read-only historical record honoring past earned badges and stars.

### B. Contrast & Accessibility Invariants
- **Yellow Active Headers MUST Use Dark Text**: Never use white text on yellow headers. Always use Dark Charcoal (`#1e293b`) for an outstanding 9.8:1 contrast ratio that exceeds WCAG 2.1 AAA standards.
- **Declarative State Binding**: All header, cell, and total elements must declare their state via `data-column-state="active_today|active_past|active_future|selectable_today|selectable_past|future_locked|superseded|historical"` to guarantee CSS styles are driven directly by the state machine without fragile `:not()` selectors.
- **Parent Exception Mode Elevation**: In Exception Mode (`.exception-mode`), all non-superseded cells elevate to full opacity (`opacity: 1 !important`) with soft amber tint (`#fffbeb`) to signal direct parent toggling.

### C. Responsive Viewport Policy: Zero Scroll (Tablet/Desktop) vs. Horizontal Scroll (Mobile)
- **Desktop & Tablet Viewports ($\ge 768\text{px}$)**: Strict **Zero Horizontal Scroll** policy. The weekly grid fits 100% of `.chart-container` without horizontal scrollbars (`overflow-x: hidden; width: 100%; table-layout: fixed; min-width: 0;`), providing an unclipped, glanceable view of the full week.
- **Mobile Viewports ($< 768\text{px}$)**: **Horizontal Scrolling Enabled**. To prevent 9-column accordion compression and overlapping 36px Pokéball assets on narrow phone viewports (360px–430px), `.grid-scroll-wrapper` must enable horizontal scrolling (`overflow-x: auto; -webkit-overflow-scrolling: touch; overscroll-behavior-x: contain;`) with a minimum table width (`min-width: 620px`). This guarantees each day cell maintains $\ge 50\text{px}$ width so Pokéball circles, rest passes, and bonus badges never collide or overlap.

## 14. Task Checkbox State Matrix & Icon Iconography (Pokéball, Rest Day 💤, Bonus ✨, and Great Ball +XP)
See canonical PRD [`docs/prd_rest_day_passes_and_bonus_tasks.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_rest_day_passes_and_bonus_tasks.md) for full specs. All checkbox states use a strictly locked 36px × 36px circular footprint:

1. **Normal Unchecked (`.checkbox-cell`)**:
   - 36px circle with `3px solid #2d3748` border.
   - Upper dome: Dormant Grey `#cbd5e0`, border-bottom `3px solid #2d3748`.
   - Lower dome: Pure White `#ffffff`.
   - Center button: 10px circle, white `#ffffff` with `3px solid #2d3748` border.

2. **Normal Checked (`.checkbox-cell input:checked`)**:
   - Upper dome: Pokémon Red `#ff3c3c` (`var(--poke-red)`).
   - Center button: Pokémon Yellow `#ffcb05` (`var(--poke-yellow)`).

3. **Rest Day (`.checkbox-cell.excused-cell.rest-cell`)**:
   - Strictly non-clickable in child mode: `<input type="checkbox" disabled>`, `pointer-events: none !important; cursor: default !important;`.
   - `border: none !important; background: transparent !important; box-shadow: none !important;`
   - Floating `💤` emoji (`19px`) with `filter: drop-shadow(0 2px 4px rgba(100, 116, 139, 0.35))`.
   - Cell background: diagonal stripes `repeating-linear-gradient(-45deg, #f8fafc, #f8fafc 4px, #e2e8f0 4px, #e2e8f0 8px)`.
   - Invariant: Eliminates false button affordance for 7yo; lowers daily required chore goal. Cannot be checked or turned into a Great Ball. (In Parent Exception Mode, clicking cycles the exception state).

4. **Bonus Task Unchecked (`.checkbox-cell.excused-cell.bonus-cell input:not(:checked)`)**:
   - `border: 3px dashed #0284c7 !important; background: #ffffff !important; border-radius: 50% !important;`
   - Centered `✨` emoji (`16px`).
   - Cell background: Soft Sky Blue tint `#f0f9ff`.
   - Interactive: `cursor: pointer;`, hover lift.

5. **Completed Bonus Task (`.checkbox-cell.bonus-cell input:checked`)**:
   - Authentic Pokémon **Great Ball (Super Ball)** vector SVG (exclusive to completed bonus tasks):
     - Top dome: Royal Cobalt Blue `#2563eb` with dark charcoal outer stroke (`#2d3748`, `stroke-width="3"`).
     - Left red capsule element (~10 o'clock): Angled rounded pill from `(8.8, 9.2)` to `(13.2, 13.6)` outlined in `#2d3748` (`stroke-width="5"`) with scarlet core `#ef4444` (`stroke-width="2.6"`).
     - Right red capsule element (~2 o'clock): Angled rounded pill from `(27.2, 9.2)` to `(22.8, 13.6)` outlined in `#2d3748` (`stroke-width="5"`) with scarlet core `#ef4444` (`stroke-width="2.6"`).
     - Equator band: dark charcoal `#2d3748` line (`stroke-width="3"`).
     - Center button: outer 12px dark circle (`r=6`) in `#2d3748`, inner golden yellow button (`r=4.2`) in Pokémon Yellow `#ffcb05`.
     - Bottom hemisphere: pure white `#ffffff` with subtle crescent base shadow (`#e2e8f0`).
   - Floating Badge: `.pokeball-checkbox:has(input:checked)::after` with text `+XP`, font `Fredoka One`, `font-size: 7px`, background `#1d4ed8`, border `1px solid #1e3a8a`, color `#ffffff`, `top: -6px; right: -2px;`.
   - Awards `+10 XP` to partner Pokémon and unlocks `(Super Trainer! 🚀)` footer.

## 15. Daily Total Row (Child Readability Invariant)
- **Only Clean Icons (No Sub-Labels)**: Day cells in the `Daily Total` row (`tr.total-row td.day-total-cell`) must display ONLY the clean status icon (`❌` for incomplete days, `🌟` for completed days, `➖` for superseded days).
- **No Fractional Text for 7-Year-Olds**: Never render fractional progress text (e.g. `1 / 3 (+1)`, `0 / 0 ⭐`, `4 / 4`) below the icons in the chart cells. For a 7-year-old child, these numbers create unnecessary cognitive clutter.
- **Parent Tooltip Support**: Full count strings (e.g. `1 / 3 (+1)` or `5 / 4 ⭐ (Super Trainer! 🚀)`) must be preserved in the cell and badge `title` attributes for optional hover inspection by parents.
## 16. XP Float Animation (Child Dwell Time & Readability Invariant)
- **Extended Dwell Phase (1.5s+ Hold)**: Floating reward feedback text (e.g. `+10 XP`, `+20 XP! 🎉`, `+10 XP Super Trainer! 🚀`) must never vanish or race upwards too quickly. Total animation duration is 2.5s with a locked, rock-steady hold phase between 18% and 75% (~1.4–1.6s) so a 7-year-old child can comfortably read every word and emoji before it gently fades.
- **Child-Friendly Typography (`Fredoka One`)**: Floating XP text uses `font-family: 'Fredoka One', cursive, sans-serif` with thick 2px dark outlines (`#1e293b` or `#1e3a8a`), ensuring crisp, cheerful legibility against any background.
- **Center Alignment & Viewport Clamping**: Floating text is centered over the clicked Pokéball via `transform: translate3d(-50%, ..., 0)` and clamped horizontally (`110px` from viewport edges) so long phrases like `+10 XP Super Trainer! 🚀` never clip off the screen on mobile devices or edge columns (Sunday/Saturday).
- **Celebratory Styling**:
  - Regular chore: Vivid Emerald XP Green (`#22c55e`).
  - Day Complete Star (`+20 XP! 🎉`): Pokémon Yellow (`#ffcb05`) with Navy outline and warm glow.
  - Overachiever Great Ball (`+10 XP Super Trainer! 🚀`): Pokémon Yellow (`#ffcb05`) with Royal Blue outline and electric blue aura.

## 17. Persistent Mode Toolbars & Floating Dock Hierarchy (Parent vs. Child Viewport Zones)
When presenting temporary or administrative modes (e.g., Exception Mode, Batch Reordering, or Multi-Day Overrides) alongside persistent child gamification elements (e.g., Sticky Mini-HUD):

1. **Spatial Separation of Concerns**:
   - **Top Viewport (Child Domain)**: Reserved strictly for partner status, level, and XP progression (`.mini-hud`). Never dock administrative override toolbars adjacent to or directly stacked beneath the Mini-HUD on mobile/tablet screens.
   - **Bottom Viewport (Parent Domain)**: Administrative action toolbars must float as an elevated dock/pill anchored to the bottom center of the viewport (`bottom: max(18px, env(safe-area-inset-bottom, 18px))`).
2. **Thumb Zone Ergonomics (Fitts's Law)**:
   - Action buttons intended for tablet/mobile interaction (such as "Done", "Save", or "Cancel") must remain within the natural thumb reach zone (bottom 25% of viewport).
   - Touch targets must measure at least 42px in height with explicit active tap states (`transform: translateY(2px)`).
3. **Visual Balance & Palette Quarantine (No False Affordances)**:
   - Floating administrative docks must use a neutral, high-contrast dark foundation (`rgba(30, 41, 59, 0.96)` Slate 800 with dark slate retro border and backdrop blur).
   - Mode indicators (`.exceptions-mode-badge`) must be styled as clean typographic headers (soft coral uppercase text with subtle tracking) without button-like background fills, borders, or drop shadows to eliminate false button affordances. The completion button (`Done ✅`) must remain the sole interactive CTA.
   - Instructional prompts (`.exceptions-prompt`) must be syntactically and visually fused to the state sequence (`🔴 Normal ➔ ✨ Bonus ➔ 💤 Rest`) via colon punctuation and shared baseline alignment.
4. **Bottom Scroll Clearance**:
   - Containers in active administrative modes (`.layout-container.exception-mode`) must declare sufficient bottom padding (`padding-bottom: 96px`) so scrolled content at the bottom of the page (such as milestone reward dropdowns and buttons) is never permanently occluded by the floating dock.
5. **Zero Inline Styles**:
   - Do not use inline `style="..."` attributes on buttons or spans inside floating bars. All spacing, flex gaps, and alignment must be defined in `style.css` using `gap` rhythms (Rule 12).
