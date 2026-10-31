# CHECKPOINT 84

This document contains a complete, chronological record of user requests, system
configurations, version progress, and active schema definitions for the
application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Modal theme alignment**: every kid and family modal follows Direction B "Pokémon Center" / U1 "Pastel Castle". Owner decisions Q1–Q4:
  - Q1: Badge Case and Guide use the white 26px panel, tray well and candy-lip cards.
  - Q2: the Vault keeps its dark Cosmic Nebula star cabinet.
  - Q3: the showcase `LV` badge is a Nunito pill.
  - Q4: profile cards keep the child's chosen Pokémon avatar and never show the theme.
  - Commits `f26dd54`, `7935d80`, `96c5a56`. Manual test plan: `docs/test_plan_modal_theme_alignment.md`.
- [x] **One name per concept in the Unicorn theme** (UX Rule 21):
  - "Partner", not "Companion": `Magical Partner Shop! 🦄`.
  - "Badge", not "Gem": `THIS WEEK'S BADGE`, `Badge Case`, `<Name>'s Royal Badge Case`, `You have collected N Badge(s)!`, and the empty-state copy.
  - `👑 MEGA MILESTONE PROGRESS`.
  - Commits `0126606`, `b167542`.
- [x] **Shop/Badge Case dropdowns**: custom chevron inset 16px, `padding: 6px 38px 6px 16px`. The 3 shop selects share the row equally (`0126606`).
- [x] **Unicorn Vault icon**: Option 1, Faceted Crystal Diamond + Gold Sparkle. It replaces the domed jewel box, which "looked like a cake" (`7a77aeb`).
- [x] **Add Child partner icons**: 76px sprites (64px below 600px), a 680px modal and a sky-blue tray with candy-lip cards (`478db08`).
- [x] **Debug Panel restyle**: white 26px skin panel and grouped sections ("Jump ahead", "Mega cycle week", Future Edits toggle switch, "🏅 Badges"). Readable white pills replace white-on-amber. Zero inline styles; IDs unchanged; TC55 (`d43c339`).
- [x] **Grid Vault tile in portrait**: sized from its cell (`calc(100% - 12px)`, max 56×44, 4px lip reserved) so it no longer runs edge to edge or onto the panel corner. Landscape is unchanged (`2c46e77`).
- [x] **Footer toolbar** (owner picked option D, with a twist; UX Rule 22, TC130):
  - Layout: version on the left; Switch Trainer / Parent Admin as quiet tinted pills **centred** in the panel (`1fr | auto | 1fr` grid).
  - Main-screen `🔄 Reset Week`: hidden while the week runs. It appears left of Switch Trainer in a bold "due" colour (dark on orange / white on raspberry) only when the week has ended and the grid isn't reset.
  - Admin › Tonight's Check-in › *Start a new week* (`#admin-reset-week-btn`, above Fix last week): always available, greyed until the week ends.
  - Commits `7a1690d`, `6bb7a7a`.
- [x] **Big Buttons week ribbon fit**:
  - Tray padding `4px 5px 8px` reserves the lips (`7249254`).
  - Every ribbon tile uses a 3px lip (`92495f2`).
  - The Vault is aligned **optically**: tile + dark lip ends halfway through the pills' pale lip (`margin-bottom: 1.5px`, `contain: size`). The owner tested 0px ("hangs below") and 3px ("too short") (`6491c04`, `ed4a15e`). UX Rule 12.
- [x] **Intermittent suite timeout at TC21, a real app bug**: `releaseAdminHistoryEntry` (admin.js) could call the asynchronous `history.back()` twice before its popstate landed, leaving the app. Fixed; 4/4 suite runs then passed (`ef31929`). The same race could exit the app on Android Back.
- [ ] **Owner VQA on the tablet** of all of the above (both kids, both chart styles, a past week, a week-ended state for Reset Week).
- [ ] **Prod acceptance (carried)**: Kepler's Thursday star via Fix last week.

### Known Follow-ups / Nice-to-haves

- [ ] **Stale build on one device**: the owner's Unicorn screenshot on 2026-10-31 still showed the old jewel-box Vault icon (replaced in `7a77aeb`). After this deploy, confirm both tablets pick up `v272` (Admin › Data › Reload latest version if not).
- [ ] **Phone Vault height**: with the optical alignment the Big Buttons Vault is 53.9px on tablets but 50.5px on phones below 520px, under the 52px Rule 12 minimum. Tablets are the target, so this was accepted; revisit if phones matter.
- [ ] **`#vault-debug-panel`** (inside the Star Vault modal) still uses the old debug button style; offered, not yet requested.
- [ ] `--sk-warn-*` tokens are now unused (Reset uses `--sk-due-*`); safe to delete.
- [ ] Resolved from Checkpoint 83: crown glint stays top-left (owner confirmed); the Unicorn Big Buttons title starts with ✨ (`dayTitleEmoji`).
- [ ] Carried: Goal column tight at ~1024px landscape; Unicorn Phase 1 gaps (grey Mega-slot sprites); Phase 2 companions; star shower ignores `prefers-reduced-motion`; **§7 Phase 3** (V20, TC116); Mega slot "?" edge; claimed-rewards history shows stored values; real-Firebase sign-out check; kid-side inline styles (Rule 8); `viewport-fit=cover`; test-harness sleep savings.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v272`**. Asset tags: `style.css?v=11.35`, `app.js?v=11.35` (+ all 14 importmap entries `?v=11.35`), `particles.js?v=10.8`. The app label is still `v1.8.0 (v58)`.
*   **Admin Password**: family Parent PIN at `users/{uid}.adminPassword` (legacy fallback `"zxcv"`).
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`). Emulator login `crsjain+staging@gmail.com` / `food3333`.
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Test Suite**: **117 blocks, 116 unique numbers** (`dupes:12`; gaps 40, 43, 44; max **130**; TC116 reserved; next free **131**). `node run_headless_tests.js` ~37–49 s. A mid-suite `Page.frameStartedNavigating` + `Runtime.executionContextsCleared` in the log means the page left. A 60 s timeout says nothing about pass/fail, because later asserts never run.
*   **Measurement scripts** (this session, `~/.gemini/jetski/brain/d6759f15-b238-4895-bca4-80a2eb52b7c3/scratch/`, served from the conv `2aa9b995` rig `site/` on `:8011`; run its `mkindex.sh` first):
    - `vaultfit.js`: grid Vault insets + version overlap.
    - `bbvault.js`: Big Buttons ribbon geometry; env `THEME`, `VPS`.
    - `footshot.js`: footer due/mid states.

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 82 §3](checkpoint_82.md) (`chartStyle`, `theme` per child). **No schema bump or migration this session.**

---

## 4. Work Accomplished

### Modal theme alignment
* **`style.css`**: Group A–E modal rules scoped under `body[data-theme]`: Badge Case/Guide panels, the Vault shell around the dark cabinet, the showcase LV pill, and neutral family modals.
* **`tests.js`**: TC62 and TC127 updated.

### Unicorn copy and icons
* **`app.js`** `getThemeCopy()` / `applyThemeUI()`, **`badges.js`**: Badge / Mega Milestone / Partner wording.
* **`style.css`**: `--sk-vault-icon` diamond; shop dropdown chevrons and equal widths.

### Add Child and Debug Panel
* **`style.css`**: `.icon-picker-*` enlarged; `.debug-*` skin.
* **`index.html`**: debug sidebar markup regrouped with no inline styles.

### Footer toolbar and Reset Week
* **`index.html`**: `.actions` = version + `.actions-buttons`; Admin *Start a new week* row.
* **`app.js`**:
  - `openResetWeekConfirm()` is shared by both buttons.
  - `updateAdminResetWeekButton()` sets the Admin button state and its unlock-date help text.
  - The main `#reset-btn` toggles `.hidden` via `canStartNextWeek(..., forceCheck = true)`.
* **`style.css`**:
  - `--sk-soft-btn-bg`, `--sk-due-*` and `--sk-footer-rule` tokens in both themes.
  - The footer grid layout.
  - The version label is no longer absolutely positioned.

### Ribbon and grid Vault fit
* **`style.css`**:
  - Portrait `.grid-vault-tile` sizing.
  - `.simplified-week-row` padding.
  - 3px ribbon lips.
  - Optical Vault offset (`margin-bottom: 1.5px`, `contain: size`).

### Admin history race
* **`admin.js`**:
  - `releaseAdminHistoryEntry` returns early while `ignoreNextAdminPop` is set.
  - `handleAdminPopState` re-pushes the entry if Admin reopened while the pop was in flight.

### Docs
* `README.md`, `_agents/AGENTS.md`, `_agents/rules/ux-guidelines.md`: Rules 12, 15 and 21 updated; new Rule 22 (footer).
* PRDs: `prd_unicorn_princess_theme.md`, `prd_simplified_chart_style.md`, `prd_admin_panel_redesign.md`, `prd_parent_past_day_approval.md`.
* New test plan: `test_plan_modal_theme_alignment.md`.

### Tests
* TC55 asserts the Debug Panel skin.
* TC127: badge copy, enlarged picker, footer button colours.
* TC128: 3px Vault lips.
* New **TC130**: footer order, Reset Week hidden mid-week and shown when due, no version overlap, and the Admin Reset Week path.

---

## 5. Files and Code

### Created Files
* [`docs/test_plan_modal_theme_alignment.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/test_plan_modal_theme_alignment.md): manual test plan for themed modals and Unicorn Big Buttons.
* [`docs/checkpoint_84.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_84.md): this file.

### Edited Files
* [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css): modals, dropdowns, Vault icon, picker, debug panel, footer, ribbon/Vault fit.
* [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html): debug sidebar, footer toolbar, Admin Reset Week row, cache tags.
* [`app.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js): theme copy, Reset Week visibility + Admin button.
* [`admin.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/admin.js): history race fix.
* [`badges.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/badges.js): Unicorn badge wording.
* [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): TC55, TC62, TC127, TC128, TC130.
* [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): `v272`.
* `README.md`, `_agents/AGENTS.md`, `_agents/rules/ux-guidelines.md`, PRDs listed above.

---

## 6. Validation Instructions

1. **Unicorn copy**: switch Lyra to Unicorn. The trainer area says `THIS WEEK'S BADGE`, `👑 MEGA MILESTONE PROGRESS` and `Badge Case`; the Shop says `Magical Partner Shop! 🦄`; the Vault tile shows a diamond.
2. **Add Child**: Switch Trainer → + Add Child → PIN. The partner icons are large, 5 per row on a tablet.
3. **Debug Panel**: Admin › Data › Advanced › Debug Sidebar. Check the grouped sections, the toggle switch and readable buttons.
4. **Footer**: mid-week, only Switch Trainer + Parent Admin show, centred, with the version at the left. On the day the week ends (or with a week left un-reset), a bold `🔄 Reset Week` appears left of Switch Trainer. Admin › Settings › Tonight's Check-in › Start a new week is greyed with "Unlocks on …" until then.
5. **Ribbon**: in Big Buttons, the Vault's bottom reads level with the day pills in both themes (today's pill may sit very slightly lower).
6. **Portrait grid**: on a portrait tablet with Standard style, the Daily Total Vault tile has clear space on all sides; the version line never sits under Parent Admin.
7. **Admin open/close**: open and close Parent Admin several times quickly. The app never navigates away; Android Back from Admin just closes Admin.
8. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass.
