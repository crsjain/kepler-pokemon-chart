# CHECKPOINT 69

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Batch 2 (Phases 1–5) of the Parent Admin Panel UX Revamp**:
  - **PRD v2.0 (`36d6a8e`)**: folded the UX revamp proposal, owner decisions Q1–Q14, and all 12 Batch 2 review-panel mitigations into [`docs/prd_admin_panel_redesign.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_admin_panel_redesign.md) (§11).
  - **Phase 1 (`e2ee655`)**: `.adm-card` / `.adm-eyebrow` / `.adm-saved-status` ("✓ Saved" inline indicator on auto-save Settings cards), in-app `#admin-backup-dialog` replacing native `window.prompt()` (`setReadBackupCodeMock` for tests), bottom-right `.adm-toast` (`showAdminToast`) replacing success modals, collapsible `<details class="adm-advanced">` on Data with offline-guarded `Reload latest version`, and focus management across `#admin-modal` / `#password-modal` / `#confirm-modal`. **TC98**.
  - **Phase 2 (`616bebf`)**: Activities draft model with sticky `.adm-savebar` (`Save` / `Discard` + count), CSS-driven `.is-dirty` dot on `✅ Activities` and `🎁 Rewards` tabs, three-outcome `Unsaved Changes ✏️` guard (`Save` / `Discard` / `Keep editing` via optional third action on `showCustomConfirm`) on tab switch, Close, `✕`, backdrop, Escape, and Android back (`history.pushState` + `popstate`), `▲▼` active-task reorder (preserving retired tasks' indices), and `🧸 Chart style` placeholder moved to the bottom of Activities. Verified zero guard on a clean `Set Exceptions` path. **TC99**.
  - **Phase 3 (`147aa08`)**: folded `🔑 Passcode` into `👥 Family` (6 → 5 tabs), moved `+ Add child` inside `👥 Family` without switching the active profile or re-prompting for the passcode (shows a toast), and added WAI-ARIA roving `tabindex` + arrow/Home/End keyboard navigation across the tab bar. **TC100**.
  - **Phase 4 (`0e33f2b`)**: inline Weekly & Mega Milestone rewards editor directly inside `🎁 Rewards` for the active child (`#rewards-editor` re-parented between `#admin-rewards-editor-host` and `#edit-rewards-modal` so all element IDs stay unique), shared sticky `Save / Discard` bar + unsaved guard, restyled pop-up sheet for non-active children (`Edit Rewards` in `👥 Family`), and collapsible `Claimed Rewards History`. **TC101**.
  - **Phase 5 (`f67362a`)**: 2-second press-and-hold (`Hold 2s to delete <Child>` / `Hold 2s to reset <Child>`, with `prefers-reduced-motion` fallback and `setHoldDurationMock`) on destructive confirms, `↩ Admin` button on the Exception Mode dock (`reopenAdminFromExceptions` without re-entering the passcode), and Rule 8 inline `z-index` cleanup on `#guide-modal`, `#family-login-modal`, `#profile-select-modal`, and `#add-profile-modal`. **TC102**.
- [x] **Modal click-outside (backdrop) policy (`1b9dfbb`)**: crsjain: *"I no longer can click outside the boundary of a modal to close it… Is it generally best practice to allow users to click outside the modal to close it, which should discard any unsaved changes when I do so?"* Added [`modal_backdrop.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/modal_backdrop.js) (`isBackdropClick` / `bindBackdropDismiss` with a capture-phase `pointerdown` → `click` drag guard so text-selection drags never close a modal) and wired consistent backdrop dismissal across all dismissible modals: Shop, Partner Picker, Passcode prompt, Add Child (clean closes; typed name opens `Discard New Child? ✏️`), Rewards sheet (clean closes; dirty opens `Unsaved Changes ✏️`), Admin (clean closes; dirty opens `Unsaved Changes ✏️`), Guide, Star Vault, Badge Case, Partner Showcase, Profile Switcher, Confirm, and Backup dialog. Eevee Evolution and Family Login stay explicit-choice only; Level Up keeps its 1.5s dwell guard. **TC103**.
- [x] **Activities card boundary & summary rows (`e64b36d`, `0978b88`)**: crsjain: *"Change the activity tab styling so that it is more similar to the styling of the other tabs"* and *"It's a little difficult to read the Activities tab since it's just white with lots of lines. Can the UX designer advise whether there's another approach…"* Wrapped Activities in `.adm-card.adm-activities-card` and implemented UX Review Option A: each activity renders in read mode as `emoji tile · bold name · 1-line grey instructions` on a pale `--adm-canvas` well with borderless `▲▼`, tonal `✏️`, and `🗑`. Clicking `✏️` expands one row at a time into flat labelled fields (`✓` Done). Form inputs stay in the DOM so the draft model, sticky Save bar, and unsaved guard are unchanged. **TC104**.
- [x] **Remove ellipsis on Restore button (`b05afad`)**: crsjain: *"The 'Restore from Code...' text is truncated. Please fix."* Dropped the trailing `…` from both `📥 Restore from code` buttons on the Data tab.
- [x] **Settings tab list rows (`0da451b`)**: crsjain: *"The elements on the Settings tab looked really spread out horizontally. Have the UX designer review and propose an alternative…"* Implemented UX Review Option A: each setting in `#admin-pane-today` is a two-line `.adm-setting-row` grid (`bold sentence-case name` + `.adm-setting-help` wired via `aria-describedby` on the left; 220px select, switch, or content-width `Set Exceptions` button on the right) separated by 1px hairline dividers, stacking cleanly below 520px. Shortened time-zone labels (`Automatic (device)`, `Pacific (US & Canada)`, etc.) so the longest option never clips at 220px. **TC105**.
- [x] **Tonal-blue Admin footer Close button (`9326cde`)**: crsjain: *"Make the 'Close' button at the bottom of the parent admin panel a different color. Right now it's white and it fades into the background."* Switched `#close-admin-modal-btn` from `.adm-tertiary` to `.adm-secondary` (tonal blue `#e3edfb` fill, `#1d4f90` text, `#2a71d0` border + pixel shadow).

### Known Follow-ups / Nice-to-haves

- [ ] **Historical week task order after a reorder**: `▲▼` reorders active tasks in `state.tasks` while preserving retired tasks' slots; active tasks displayed in a historical week follow the new array order (freezing per-week historical order would require a persisted per-week task-order array and a schema migration).
- [ ] **Remaining kid-side inline styles (Rule 8)**: `#guide-modal`, `#family-login-modal`, `#profile-select-modal`, and `#add-profile-modal` wrapper `z-index` attributes were moved to CSS in Phase 5, but inner kid-modal form controls, the debug sidebar, and the header Guide button still carry legacy inline styles.
- [ ] **`viewport-fit=cover` safe-area**: deliberately deferred until kid-HUD notch padding can be verified on hardware.
- [ ] Carried: **Chart Style (under 5)** needs its own PRD before it's built.
- [ ] Carried: logged-in manual check of the per-child reset and Activities merge-by-id save against real Firestore.
- [ ] Carried: ~8 s zero-risk test-harness sleep savings (`docs/refactoring_assessment_2026_09_12.md` §6.1).

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: `v1.10.29` / Service Worker cache **`poke-chart-cache-v200`** / Asset tags `style.css?v=10.87`, `app.js?v=10.77` (+ all 14 `<script type="importmap">` entries `?v=10.77`), `particles.js?v=10.4`
*   **Admin Password**: `"zxcv"`
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`)
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths, never `git add -A`.
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Audio/Volume Settings**: Unchanged.
*   **Test Suite**: **93 blocks, 92 unique numbers** (`dupes:12` expected; gaps `40, 43, 44` historical; max **105**, next free **106**). **~33 s.**

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 64 §3](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_64.md). No new persisted field and no migration (admin drafts, summary-row edit state, and backdrop pointer tracking live in the DOM or module-local state only).

---

## 4. Work Accomplished

### Batch 2 Phases 1–5 — Parent Admin Panel UX Revamp (`36d6a8e` … `f67362a`)
* **`docs/prd_admin_panel_redesign.md`**: updated to v2.0 (§11.1–§11.8) covering the 5-tab IA, component recipes, draft & unsaved-changes guard, inline rewards editor, 2s hold-to-confirm, and post-Batch 2 refinements for Activities and Settings.
* **`admin.js`**: in-app `#admin-backup-dialog` (`openBackupCodeDialog` + `setReadBackupCodeMock`), bottom-right `.adm-toast` (`showAdminToast`), inline `✓ Saved` indicator (`flashAdminSaved`) on auto-saving Settings controls, offline-guarded `Reload latest version`, Activities draft snapshots with `isTasksDirty()`, sticky `.adm-savebar`, `.is-dirty` tab dots (`updateAdminDirtyIndicators`), three-outcome `Unsaved Changes ✏️` guard (`guardUnsavedChanges`), active-task `▲▼` reorder (`moveTaskRow`), 5-tab roving `tabindex` + arrow/Home/End navigation, and `reopenAdminFromExceptions()` (`↩ Admin` on the Exception Mode dock).
* **`rewards_admin.js`**: re-parents `#rewards-editor` between `#admin-rewards-editor-host` (inline on `🎁 Rewards` for the active child) and `#edit-rewards-modal` (pop-up sheet for non-active children from `👥 Family`), exposes `isRewardsDirty()`, `saveInlineRewards()`, `discardInlineRewards()`, and guards sheet dismissal when dirty.
* **`app.js`**: optional third action button (`#confirm-third-btn`) and 2-second press-and-hold (`holdSeconds` + `setHoldDurationMock`) on `showCustomConfirm`, Admin-origin `+ Add child` flow that stays inside Admin without switching the active profile or re-prompting for the passcode, and focus restoration across dialogs.

### Consistent Modal Backdrop Dismissal (`1b9dfbb`)
* **`modal_backdrop.js` (new)**: exports `isBackdropClick(e, modal)` and `bindBackdropDismiss(modal, onDismiss)`, tracking capture-phase `pointerdown` targets on the overlay so dragging a selection from inside a dialog onto the backdrop never closes it.
* **`app.js`, `admin.js`, `rewards_admin.js`, `shop.js`, `guide.js`, `vault.js`, `badges.js`**: unified all dismissible modals on `modal_backdrop.js`, adding backdrop dismissal to Partner Shop, Partner Picker, Passcode prompt, Add Child (with `Discard New Child? ✏️` when dirty), and Rewards sheet (with `Unsaved Changes ✏️` when dirty).

### Post-Batch 2 UX Refinements (`e64b36d`, `b05afad`, `0978b88`, `0da451b`, `9326cde`)
* **Activities summary rows (`admin.js`, `style.css`, `index.html`)**: wrapped the Activities list and `+ Add Activity` in `.adm-card.adm-activities-card`; each row renders in read mode (`syncTaskSummary`) with `.adm-task-emoji`, `.adm-task-name`, `.adm-task-instr`, borderless `▲▼`, tonal `✏️` (`.edit-task-btn`), and `🗑`. `setTaskRowEditing` expands one row at a time into flat labelled inputs and re-opens the affected row on add, empty-name error, or save conflict.
* **Settings list rows (`index.html`, `style.css`)**: converted `#admin-pane-today` rows to `.adm-setting-row` grids (`1fr auto`, hairline dividers, `.adm-setting-name` + `.adm-setting-help` wired via `aria-describedby`, content-width `Set Exceptions`, shortened time-zone labels).
* **Data & Footer polish (`index.html`)**: removed trailing `…` from `📥 Restore from code`; changed `#close-admin-modal-btn` from `.adm-tertiary` to `.adm-secondary`.
* **`tests.js`**: added **TC98–TC105** (8 new regression test blocks; 93 blocks / 92 unique numbers total).

---

## 5. Files and Code

### Created Files
* [`modal_backdrop.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/modal_backdrop.js): shared backdrop-click detector and binder with `pointerdown` → `click` drag guard.
* [`docs/checkpoint_69.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_69.md): this checkpoint document.

### Edited Files
* [`admin.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/admin.js): Phases 1–5 admin revamp, summary-row tap-to-edit (`syncTaskSummary`, `setTaskRowEditing`), backdrop helper wiring.
* [`rewards_admin.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/rewards_admin.js): inline rewards host re-parenting, dirty tracking, sheet unsaved-changes guard, backdrop helper wiring.
* [`app.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js): confirm third-action + 2s hold-to-confirm, Admin-origin Add Child without profile switch, `↩ Admin` dock wiring, backdrop dismissals.
* [`shop.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/shop.js), [`guide.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/guide.js), [`vault.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/vault.js), [`badges.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/badges.js): backdrop dismissal via `modal_backdrop.js`.
* [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html): 5-tab admin markup, Settings list rows, Activities card wrapper, inline rewards host, restore dialog, toast & save bars, `↩ Admin` dock button, tonal-blue `Close`, importmap (`modal_backdrop.js`, `?v=10.77`), `style.css?v=10.87`.
* [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css): Batch 2 component/layout styles, Activities summary-row well & edit states, Settings `.adm-setting-row` grid & responsive stacking.
* [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): `CACHE_NAME` → `poke-chart-cache-v200`; added `./modal_backdrop.js` to `ASSETS_TO_CACHE`.
* [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): updated existing admin tests for 5-tab IA / inline rewards / hold-to-confirm and added **TC98–TC105**.
* [`docs/prd_admin_panel_redesign.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_admin_panel_redesign.md): v2.0 (§11.1–§11.8).
* [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md): updated Parent Admin Panel, Exception Mode dock, and ES6 module list documentation.

---

## 6. Validation Instructions

1. **Cache**: hard-refresh `https://crsjain.github.io/kepler-pokemon-chart/` and confirm `poke-chart-cache-v200` (`style.css?v=10.87`, modules `?v=10.77`).
2. **Settings list rows**: open Admin (`zxcv`) → `🗓️ Settings` shows two-line rows (bold name + grey helper) with compact controls on the right (`Set Exceptions`, `2 min`, switch, `Sunday`, `Automatic (device)`, `10 min`), separated by hairline dividers; toggling a setting flashes `✓ Saved` in the card header.
3. **Activities summary rows & draft**: tap `✅ Activities` → rows display as clean summary lines on a pale well; tap `✏️` on one row to expand its fields (`✓` closes it); reorder with `▲▼`; switch tabs or click outside with unsaved edits to verify the 3-button `Unsaved Changes ✏️` guard (`Save` / `Discard` / `Keep editing`).
4. **Inline Rewards & Family**: tap `🎁 Rewards` to edit the active child's rewards inline; tap `👥 Family` to see `Children` (`+ Add child` stays in Admin; `Edit Rewards` on a non-active child opens the pop-up sheet) above `Parent Passcode`.
5. **Hold-to-confirm & Restore dialog**: in `💾 Data`, tap `📥 Restore from code` (no trailing ellipsis) to open the in-app paste dialog; tap `Reset this child's progress` and verify the red confirm button requires a 2-second hold.
6. **Footer Close & Backdrop Clicks**: verify the bottom `Close` button is tonal blue, and clicking outside any modal overlay closes it cleanly (while dragging a text selection from inside a modal onto the backdrop does not).
7. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass (93 blocks, 92 unique numbers, including TC98–TC105).
