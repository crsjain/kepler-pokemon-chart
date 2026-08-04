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
