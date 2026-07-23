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
