# PRD: Parent Admin Panel Redesign (Left Navigation)

**Document**: `docs/prd_admin_panel_redesign.md`  
**Version**: 2.0.0  
**Status**: v1.2 implemented (Checkpoint 66) · **v2.0 UX revamp in progress** — Batch 1 (Phases 0a/0b) shipped in Checkpoint 68, Batch 2 (Phases 1–5) being implemented. See **§11** for the v2.0 spec; it supersedes v1.x where they conflict.  
**Authors**: crsjain & Jetski  
**Requested By**: crsjain (2026-09-20, seed) · specced 2026-09-24 (Checkpoint 61) · amended 2026-09-25 (Checkpoint 62: D7, D8) · implemented 2026-09-28 (Checkpoint 66) · revamp decisions locked 2026-09-28/29 (§11.2)  
**Target Systems**: `index.html`, `style.css`, `admin.js`, `app.js`, `rewards_admin.js`, `tests.js`, `service-worker.js`  
**Schema Impact**: **None** — no new persisted field (current schema is V19 as of Checkpoint 64).  
**Companion Standards**: [`_agents/rules/ux-guidelines.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/rules/ux-guidelines.md) (Rules 2, 4, 5, 6, 8, 10, 11, 12, 13B, 17), [`docs/prd_parent_past_day_approval.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_parent_past_day_approval.md), [`docs/refactoring_assessment_2026_09_12.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/refactoring_assessment_2026_09_12.md) §6.4

---

## 1. Executive Summary & Problem Statement

### 1.1 The Seed

> *"I want to start a PRD to improve the parent admin panel. It likely needs a left nav as the main screen is getting pretty crowded."* — crsjain

### 1.2 Current State (measured at `8a3e0e7`)

`#admin-modal` ([`index.html:621–766`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html#L621-L766)) is a single `.admin-grid`. It is one column below 768px and a `320px 1fr 1fr` three-column grid above it ([`style.css:2434`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css#L2434)). The first column, *Quick Actions*, holds five unrelated groups stacked vertically: Activity Settings, Backup & Sync, System & Debug, Parent Passcode, and the Danger Zone. That's the column that keeps growing. The shell is **not** Rule 4 compliant today (`max-width: 950px`, no fixed height, whole-modal scroll).

It contained **25 static IDs** at `8a3e0e7`, and **23 of them were referenced by `tests.js`** (26 after the D8 placeholder landed in Checkpoint 62). With the dynamic rows, the stacked rewards editor, and adjacent admin surfaces, the admin area accounts for 47 IDs referenced by the suite (full audit in §6).

### 1.3 The Hidden Problem: Scope Is Invisible

This finding came out of the spec session and wasn't in the seed. **Every control in the panel except Parent Passcode writes to the *active child's* profile state.** Week start, timezone, screensaver, parent edit window, approve-past-days, tasks, rewards, and claimed history all live on `state`, which is per profile (`subscribeToProfileState`). Only `saveAdminPasswordToCloud` fans out to every profile ([`firebase.js:256`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/firebase.js#L256)).

Nothing in today's UI says so. A parent who sets Screensaver to 5 minutes while Kepler is active has *not* changed Lyra's.

The inverse trap was worse: **Wipe All Progress wiped every child** (`importFamilyData({ profiles: {} })`), while its confirm copy only said "levels, XP, and badges". **Resolved in Checkpoint 62 (D7):** Wipe now resets only the active child and is already shipped ahead of the redesign.

### 1.4 Proposed Solution

Keep `#admin-modal`, but rebuild its interior as a **Rule-4-compliant two-pane shell**: a fixed left nav rail plus one scrolling content pane.

- The nav is grouped into **This child** (Today, Schedule, Tasks, Rewards) and **Family** (Children, Passcode, Data).
- A read-only **"Editing: Kepler"** scope chip in the header names the child the "This child" sections apply to.
- The panel always opens to **Today**, which holds the nightly-use controls.
- **All existing IDs stay stable** (25, plus the D8 placeholder).

---

## 2. Resolved Decisions (Locked 2026-09-24)

All six were answered directly by crsjain in the Checkpoint 61 session. They resolve seed §4 Q1–Q4, plus two questions surfaced during research.

| # | Question | Decision |
|---|---|---|
| D1 | Modal or full-screen? | **Inside `#admin-modal`**, raised to full Rule 4 (1000px / 80vh / `overflow: hidden`). Fixed nav rail, and only the content pane scrolls. Below 768px it becomes near-full-bleed with top tabs. |
| D2 | Where does the Danger Zone go? | A **visually quarantined block at the bottom of the Data section**, directly under Export, so backing up is the natural step before wiping. It doesn't get its own nav item. |
| D3 | Per-child scoping | An **"Editing: <name>" scope chip** in the header, with the nav split into *This child* and *Family* groups. **Read-only:** to change children you leave Admin. There's no in-panel child picker, because that would need non-active-profile reads and writes (new sync work). |
| D4 | Search or filter? | **No.** 7 sections and about 20 controls don't warrant it. |
| D5 | Rewards editor | **Stays a stacked modal** (`#edit-rewards-modal`), now also launched from the Rewards section for the active child. The profile-row launcher stays too. Zero ID or test churn. |
| D6 | Landing section | **Always open to Today** (Set Exceptions, Parent Edit Window, Approve Past Days). No memory, so no state field. |
| D7 *(2026-09-25)* | What does Wipe All Progress delete? | **Only the active child's progress.** Partners, XP, levels, badges, stars, grid, exceptions, weekly history, and reward picks/history reset to defaults. The child's identity and parent configuration survive: `childName`, tasks, reward options, week start, timezone, screensaver, edit window, approve-past-days, passcode, volume, and debug flag (`WIPE_PRESERVED_KEYS`, `state.js`). Other children are never touched. **Shipped in Checkpoint 62** in the current panel; the redesign carries it forward unchanged. |
| D8 *(2026-09-25)* | Under-5 chart presentation | **Placeholder only.** A greyed-out, inert **🧸 Chart Style** control (`#admin-chart-style-placeholder`) offers two options, *Big Buttons (under 5)* and *Standard (5+)*. Standard is shown selected, both are disabled, and it carries a "Coming soon" tag. It isn't wired to state and has no listener. The future feature: children under 5 with only one or two activities get much bigger, more satisfying buttons instead of a sparse chart. **Shipped in Checkpoint 62** in the current panel (Activity Settings); it moves to the redesign's **Tasks** section. It needs its own PRD and panel review before it's built. |

> [!NOTE]
> D3's answer named the child group "Schedule & Rules, Tasks, Rewards". D6 then moved the two *rules* controls (Edit Window, Approve Past Days) into **Today**, so the remaining section is just **Schedule**.

> [!WARNING]
> **Superseded in v2.0 (owner-signed, §11.3):** D1's single 768px breakpoint (Q1), D5's stacked rewards modal for the *active* child (Q3 — the modal survives only for non-active children), D8's placement at the *top* of Activities (Q5 — now the bottom), the 6-tab map in §3.1 (Q11 — Passcode folds into Family, 5 tabs), and §4.2's "no nav badges" (Q2 — a CSS dirty dot). D2, D3, D4, D6 and D7 stand unchanged.

---

## 3. Information Architecture

### 3.1 Section Map & Control Inventory

Every existing control has exactly one home. **No ID changes.**

| Nav group | Section (`data-admin-section`) | Controls (existing IDs unless marked 🆕) | Listener owner after redesign |
|---|---|---|---|
| *This child* | 🌙 **Today** (`today`, landing) | `#exceptions-btn` · `#admin-parent-grace-select` · `#admin-lock-past-days-toggle` + `.admin-option-hint` | `app.js` `bindExceptionModeEvents` · `bindAdminSettingsEvents` (×2) |
| | 🗓️ **Schedule** (`schedule`) | `#admin-week-start-select` + `#admin-week-start-status` · `#admin-timezone-select` · `#admin-idle-timeout-select` | `app.js` `bindWeekStartDayEvents` · `bindAdminSettingsEvents` (×2) |
| | ✅ **Tasks** (`tasks`) | `#admin-tasks-list` · `#admin-add-task-btn` · `#admin-save-tasks-btn` · `#admin-chart-style-placeholder` (D8, inert, top of pane) | `admin.js` (unchanged) · placeholder: none |
| | 🎁 **Rewards** (`rewards`) | 🆕 `#admin-customize-rewards-btn` (opens `#edit-rewards-modal` for the active child) · `#claimed-rewards-history-list` | 🆕 button: rewards-editor owner (`app.js` `bindRewardsEditorEvents` body, or `rewards_admin.js` if §7 lands first) · history: `admin.js` |
| *Family* | 👥 **Children** (`children`) | `#admin-profiles-list` (rows keep their per-row 🎁 and 🗑️ buttons) | `app.js` `renderAdminProfilesList` (render-time listeners) |
| | 🔑 **Passcode** (`passcode`) | `#admin-new-passcode-input` · `#admin-change-passcode-btn` | `admin.js` (unchanged) |
| | 💾 **Data** (`data`) | **This child:** `#admin-export-btn` `#admin-import-btn` · **Whole family:** `#admin-cloud-export-btn` `#admin-cloud-import-btn` · **System:** `#admin-diagnostics-btn` `#admin-force-update-btn` `#toggle-debug-sidebar` · **⚠️ quarantined block:** `#admin-wipe-btn` | `admin.js` · `app.js` `bindDebugSidebarToggle` (toggle only) |
| Shell | header / footer | `#close-admin-header-btn` · `#close-admin-modal-btn` · 🆕 `#admin-scope-chip` · 🆕 `#admin-nav` · 🆕 `#admin-pane-<section>` ×7 | `admin.js` (unchanged close/Escape/click-outside) + 🆕 nav switching |

Placement notes:

- **Screensaver stays in Schedule, next to Week Start and Timezone.** TC30 asserts those three selects are right-aligned with uniform width ([`tests.js:2472–2481`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js#L2472-L2481)), so they must share a pane and a row class.
- **Data's sub-headers name scope explicitly** ("This child (Kepler)" and "Whole family"). Export/Import Child and Export/Import Family are the one place where both scopes sit side by side.
- **Claimed Rewards History is per child**, because it reads `state`, so it belongs under Rewards, not Family.

### 3.2 Event-Wiring Ownership Rules

1. **No existing listener changes modules.** Every row above names the binder that owns the control *today*. The redesign moves markup, not wiring.
2. **`setupEventListeners()` is untouched.** No `bind*Events()` call is added, removed, or reordered (AGENTS.md §3).
3. **New listeners go into existing owners:**
   - **Nav switching, landing reset, scope chip:** `admin.js`, inside `initAdmin()`. `initAdmin` already runs at [`app.js:1003`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js#L1003), *before* `setupEventListeners()`, and already owns the modal's open/close lifecycle. Registration order relative to the `bind*` chain is therefore unchanged.
   - **`#admin-customize-rewards-btn`:** appended inside the body of `bindRewardsEditorEvents()`, which keeps the same call-order slot. If §7 lands first, it goes in the extracted module instead.
4. **The scope chip gets its name through a getter callback**, `getActiveProfileName: () => …`, added to the existing `initAdmin({...})` call at [`app.js:1003–1018`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js#L1003-L1018). It must be a getter, never a snapshot, because `activeProfileId` and `profilesList` are reassigned by sync and by the test helpers (`setActiveProfileId`, `setProfilesList`).

---

## 4. UI/UX Specifications

### 4.1 Shell Layout (UX Rule 4, *Multi-Column Dashboard Modals*)

D1 keeps the modal, so **every clause of Rule 4 applies**. None is waived.

| Rule 4 clause | Spec at ≥768px |
|---|---|
| `max-width: 1000px` (or 90%) | `#admin-modal .admin-modal-content { max-width: 1000px; width: 90%; }` (up from 950px / 95%) |
| `height: 80vh`, `overflow: hidden` | Same selector: `height: 80vh; overflow: hidden; display: grid; grid-template-columns: 200px minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr) auto;` |
| Grid side by side, `1fr` fallback | Header spans both columns. Nav in column 1, pane in column 2. Footer spans both. |
| `min-width: 0` on panels | `.admin-pane { min-width: 0; min-height: 0; }` |
| Only inner lists scroll | `.admin-pane { overflow-y: auto; }`. The header, nav rail, and footer never scroll. |

The **footer row** holds `#close-admin-modal-btn`, pinned to the bottom (Rule 17 thumb zone). Its ID is kept, and it has 13 test references.

### 4.2 Nav Rail

- **Markup:** `<nav id="admin-nav" class="admin-nav" role="tablist" aria-orientation="vertical">` containing `<button type="button" class="admin-nav-btn" role="tab" data-admin-section="today" aria-controls="admin-pane-today" aria-selected="true">🌙 Today</button>` and so on. Two non-interactive group labels (`.admin-nav-group-label`: "This child", "Family") separate the groups.
- **Active state:** Pikachu Yellow `#ffcb05` background with Dark Charcoal `#1e293b` text. This is the Rule 13B contrast invariant, reused so "yellow = where you are" means the same thing on every surface. Inactive: white background with Slate `#475569` text. Hover: `#eff6ff`.
- **Touch targets** are at least 44px tall, with `transform: translateY(2px)` on `:active` (Rule 17.2). Visible `:focus-visible` outline.
- **Labels** use `white-space: nowrap` (Rule 10). There are no badges or counts in the nav.

### 4.3 Content Panes

- **Markup:** `<section id="admin-pane-today" class="admin-pane" role="tabpanel" data-admin-section="today">`. Non-active panes carry the codebase's standard `.hidden` class.
- **Switching** toggles `.hidden` and `aria-selected` **only**. It never re-renders pane contents. `#admin-tasks-list` holds unsaved in-DOM edits until *Save Activities*, and a re-render on tab switch would silently discard them.
- **Rhythm (Rule 12):** `.admin-pane { display: flex; flex-direction: column; gap: 12px; }`. The new layout drops the child margins that mix with `gap` today: `.admin-section h3 { margin-bottom }`, `.admin-grid { margin-top/bottom }`, `.danger-zone-section { margin-top: 16px }`, and `.quick-actions-section .danger-zone-section { margin-top: auto }`.
- **Rows (Rule 2):** keep `.admin-option-row` (label left, control right). Cap it at `max-width: 560px`, so the label and its control stay on one short scan line in the roughly 760px pane.
- **Scrollbars (Rule 5):** `.admin-pane::-webkit-scrollbar-track { background: transparent; }`, mirroring the existing `.modal-content` rule at [`style.css:1209`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css#L1209).

### 4.4 Scope Chip

- **Markup:** `<span id="admin-scope-chip" class="admin-scope-chip">Editing: Kepler</span>` in `.admin-modal-header`, beside the `<h2>`.
- Neutral slate pill with no border shadow, so it doesn't look pressable (Rule 17.3 *No False Affordances*). Long names are truncated with `max-width` and an ellipsis (Rule 10), with the full name in `title`.
- Refreshed on every open **and** whenever `renderAdminProfilesList()` runs, which covers Firestore sync while the panel is open.
- **No active profile** (local mode, headless boot before login): the chip gets `.hidden`. It must never render "Editing: undefined".

### 4.5 Data Section & Quarantined Danger Block (D2)

The Data pane runs top to bottom: **This child (Kepler)** backup row → **Whole family** backup row → **System** → a divider → the red `.danger-zone-section` holding `#admin-wipe-btn`. The existing `.danger-zone-section` styles ([`style.css:4213`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css#L4213)) are reused as-is, minus the margins listed in §4.3.

**Wipe scope (D7, shipped in Checkpoint 62):** Wipe resets only the active child. The confirm names the child and says what is kept:

> *"This resets Kepler's levels, partner Pokémon, XP, badges, stars, and chart history back to the start. Kepler's activities, rewards, and settings are kept, and other children are not affected. This cannot be undone."*

The button itself reads **"Reset This Child's Progress"** (renamed in Checkpoint 65), and the confirm CTA reads **"Reset Kepler"** (`pixel-btn danger`). A hint under the button says *"Activities, rewards, and settings are kept. Other children are not affected."* The quarantined block therefore sits under **This child (Kepler)** export, which is the matching backup step. The redesign should render the confirm body with the R8-2 `.danger` modifier.

The title `"Wipe All Progress? 🚨"` is **unchanged**, because TC27 asserts it ([`tests.js:2315`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js#L2315)). The body text isn't asserted anywhere. The CTA stays neutral and non-celebratory (Rule 11).

### 4.6 Responsive: Below 768px (Top Tabs)

- The modal goes near-full-bleed: `width: 100%; height: calc(100dvh - 16px); max-height: none;`. The grid collapses to one column: `grid-template-columns: 1fr; grid-template-rows: auto auto minmax(0, 1fr) auto` (header / tabs / pane / footer).
- `#admin-nav` becomes a **horizontal tab strip** in the same DOM, switched by CSS only. It uses `flex-direction: row; overflow-x: auto; overscroll-behavior-x: contain; -webkit-overflow-scrolling: touch;` (the Rule 13C sandboxed-scroll pattern). Group labels are hidden and replaced by a 1px divider between the groups.
- On open, the active tab is scrolled into view with `scrollIntoView({ inline: 'nearest', block: 'nearest' })`.
- Only `.admin-pane` scrolls vertically. This satisfies Rule 8's "low-height viewports can reach all action buttons" on landscape phones, because the footer Close button is always visible.

> [!NOTE]
> **An accordion was rejected.** It would need a second DOM structure, or JS that re-parents panes, which breaks the "one pane model, CSS-only responsive" property. It would also let several panes be open at once and bring back the long scroll this redesign exists to remove.

### 4.7 UX Rule 8 Debt: Fixed as Part of This Redesign

Checkpoint 60 set the pattern: move inline styles to named classes in `style.css` next to related rules, and keep every `id`. Then verify with a CDP computed-style parity check (0 differences) before making any intentional visual change.

| # | Location | Today | Fix |
|---|---|---|---|
| R8-1 | [`app.js:814–820`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js#L814-L820), profile-row actions | `style="display:flex; gap:6px; flex-shrink:0"` on `.admin-profile-actions`, and `style="display:inline-flex; align-items:center; justify-content:center; width:36px; height:32px; padding:0"` on both icon buttons | `.admin-profile-actions { display:flex; gap:6px; flex-shrink:0; }` plus a new class `.pixel-btn.admin-icon-btn` added to `.edit-rewards-btn` and `.delete-profile-btn`. Scoped as `.admin-profile-actions .pixel-btn.admin-icon-btn` (0,3,0) so it beats `.pixel-btn.small`. **Then**, as a separate, intentional step, raise the size to **42×42** (skill minimum touch target). |
| R8-2 | [`app.js:844–850`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js#L844-L850), Delete Profile confirm | Six inline colour overrides turning `.schedule-hero-card` / `.transition-warning-callout` red | A **`.danger` modifier**, following the existing `.schedule-hero-card.future` precedent ([`style.css:5575`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css#L5575)): `.schedule-hero-card.danger { background:#fef2f2; border-color:#fca5a5; }`, `.schedule-hero-card.danger .schedule-hero-label { color:#dc2626; }`, `.schedule-hero-card.danger .schedule-hero-main { color:#991b1b; }`, `.transition-warning-callout.danger { background:#fff1f2; border-color:#f87171; }`, `.transition-warning-callout.danger .transition-callout-title { color:#991b1b; }`, `.transition-warning-callout.danger .transition-callout-desc { color:#881337; }`. It's a compound selector, so there's no collision with `.pixel-btn.danger`. **Reuse it** for the Wipe confirm body in §4.5. |
| R8-3 | [`app.js:4061`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js#L4061), empty rewards list | `<p class="no-items" style="color:#64748b; font-size:.85rem; font-style:italic; padding:5px;">` | `.no-items` currently has **zero** CSS rules and exactly one use, so add `.no-items { color:#64748b; font-size:0.85rem; font-style:italic; padding:5px; }` and drop the attribute. |
| R8-4  *(added by panel)* | [`index.html:848–870`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html#L848-L870), `#edit-rewards-modal` | 9 inline `style` attributes: the list `margin-bottom` ×2, the add-row flex ×2, input `flex/padding` ×2, the Add button `padding` ×2, and the actions `margin-top` | `.reward-add-row { display:flex; gap:8px; }`, plus `.reward-add-row .pixel-input { flex:1; padding:8px; }` and `.reward-add-row .pixel-btn { padding:8px 12px; }`. Convert the list margin and actions margin to `gap` on the `.admin-section` / modal column (Rule 12). This modal is launched from the redesigned panel and stays in scope under D5. |

> [!IMPORTANT]
> **Acceptance criterion:** after the admin panel, a profile-delete confirm, and the rewards editor (empty and populated) have each rendered, `document.querySelectorAll('#admin-modal [style], #edit-rewards-modal [style], #confirm-modal .confirm-detail [style]').length === 0`. This goes into the new TC89 (§6.3).
>
> **Out of scope:** the inline styles in `#family-login-modal`, `#add-profile-modal`, and `#profile-select-modal` ([`index.html:768–830`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html#L768-L830)). They aren't admin surfaces. They're logged as a follow-up in §9.

---

## 5. 🏛️ Feature Review Panel: 5-Perspective Cross-Functional Review

*Convened 2026-09-24 against the direction locked in §2. Per the request, **Stage 3 (Weary Parent) and Stage 4 (Staff UX) carry the most weight**, because this surface is parent-only and passcode-gated.*

### 🚦 Final Executive Verdict: **APPROVED WITH MITIGATIONS**

---

### Stage 1: 🧸 Child Development & Play Psychologist

- **Cognitive & scan friction:** Not applicable. The panel sits behind the passcode, and no child-visible surface changes. The main-screen reward dropdowns (`renderRewardDropdowns`) are untouched.
- **Emotional safety:** One indirect positive. Clear per-child scoping (the chip) makes it less likely a parent changes Lyra's approve-past-days policy by accident, which is the sibling-fairness risk flagged in the Parent Approval PRD.
- **Verdict:** **PASS** (stage run briefly, per skill guidance).

### Stage 2: 🎮 Game Economy & Habit Loop Designer

- **Chore priority & progression:** No XP, star, badge, or reward logic changes. Moving controls doesn't touch the economy.
- **One watch item:** R8-2's red Delete card and the corrected Wipe copy make destructive consequences *more* legible. That protects months of earned progress. It's a positive.
- **Verdict:** **PASS** (stage run briefly).

### Stage 3: 🏡 Family Operations / "Weary Parent" — *weighted*

- **The nightly path must not get longer.** Today, *Set Exceptions* is the first button in the first column. Under D6 it's the first control in the landing pane, so it stays at passcode → 1 tap. ✅ Parity holds.
- **"Which kid am I changing?"** This is the biggest real-world win. Before, a parent had no way to tell that Screensaver or Week Start were per-child. The chip plus the *This child* / *Family* groups answer it at a glance. ✅
- **🚩 Wipe was family-wide, and its copy said otherwise.** With "Editing: Kepler" in the header, a tired parent could reasonably believe *Wipe All Progress* clears only Kepler, and lose Lyra's months of progress too. **Resolved by D7 (2026-09-25):** Wipe is now scoped to the active child, which matches the chip. The confirm names the child and states what is kept.
- **D8 placeholder (2026-09-25 addendum):** a greyed "Coming soon" control is honest signposting. The parent can see the under-5 mode is planned, can't mistake it for a broken toggle (it's disabled, has a tag, and has a `not-allowed` cursor), and doesn't need to configure anything.
- **Unsaved task edits.** A parent edits a chore name, checks Rewards, and comes back. The edit must still be there. **Mitigation (required):** pane switching never re-renders (§4.3). Closing the modal without saving behaves as it does today (not a regression, and out of scope).
- **Passcode as its own section** is thin (one input and one button). Accepted per D3. It's rarely used, and a dedicated slot makes it easy to find the one time a year it's needed.
- **Hold-to-unlock for Wipe** (Rule 6 recommends it for irreversible actions). It's desirable, but it would change TC27's click-to-confirm flow. **Deferred to §9** so v1.0 stays zero-regression.
- **Verdict:** **PASS with 1 required mitigation** (no re-render on switch). The Wipe mitigation is resolved by D7.

### Stage 4: 🎨 Senior Staff UX Designer — *weighted*

- ***Multi-Column Dashboard Modals* (Rule 4):** Fully applied (§4.1), bringing the shell *into* compliance for the first time. ✅
- ***Transparent scrollbar tracks* (Rule 5):** Specified on `.admin-pane`. ✅
- ***Zero inline styles* (Rule 8):** The three known app.js violations are fixed (R8-1/2/3). **Panel addition R8-4:** the rewards editor's nine inline attributes, since D5 keeps that modal in the admin flow. There's a machine-checked acceptance criterion. ✅
- ***Spacing rhythm* (Rule 12):** Four margin-plus-gap mixes are named for removal (§4.3). Panes use `gap: 12px`, which gives the right shadow compensation for stacked `.pixel-btn`. ✅
- **Contrast (Rule 13B reuse):** Active nav is yellow `#ffcb05` with `#1e293b` text (≈9.8:1), never white on yellow. ✅
- ***Floating dock hierarchy* (Rule 17):** Close is pinned in a footer row (thumb zone). The admin modal stays a *modal*, not a mode toolbar, so it doesn't compete with `#parent-grace-dock` or the Exception dock. *Set Exceptions* still closes Admin before the dock appears. ✅
- **🚩 Touch targets:** The profile-row icon buttons are **36×32**, below the 42px minimum. **Mitigation:** R8-1 does the class move first (parity-checked), then a deliberate bump to 42×42. Nav items are at least 44px. ✅
- **Mobile:** A 7-tab strip at 360px scrolls horizontally, sandboxed (Rule 13C pattern), with the active tab scrolled into view. The accordion was rejected for the reasons in §4.6. ✅
- ***Awkward wrapping* (Rule 10):** `nowrap` nav labels, and ellipsis truncation on the chip. ✅
- **Verdict:** **PASS with 2 required mitigations** (R8-4 added; 42px icon buttons).

### Stage 5: 🛠️ Senior Staff Engineer & Chaos Architect

- **Tech debt & complexity:** Pane switching is about 25 lines in `admin.js`: toggle `.hidden` and `aria-selected`, reset to `today` on open, refresh the chip. **No framework, no router, no state field, no migration** (D6 means no persistence). ✅
- **ID stability:** All **25** static IDs are kept (full test-reference audit in §6.1). Only additive IDs are introduced. `.admin-grid`, `.admin-section`, and `.quick-actions-section` are wrapper classes with **zero** `tests.js` references, so they can be retired. Grep `style.css` for each one, per AGENTS.md §6.4. ✅
- **🚩 Hidden-pane coverage loss.** `HTMLElement.click()` and `value = …; dispatchEvent('change')` both work on `display:none` elements, so all 23 test-referenced IDs keep working unchanged. **But TC30's alignment asserts use `getBoundingClientRect()`** ([`tests.js:2476–2481`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js#L2476-L2481)). With Schedule hidden, every rect is zero and `|0 − 0| < 2` **passes vacuously**. The suite stays green while the check stops testing anything. **Mitigation (required):** TC30 activates the Schedule tab first and asserts `rWeek.width > 0` (§6.2).
- **Profile sync while open:** `renderAdminProfilesList()` already re-runs on profile updates ([`app.js:53`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js#L53), [`388`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js#L388)). The chip refresh hooks in there. Deleting the *active* profile already closes Admin ([`app.js:~868`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js#L868)). ✅
- **Modal stacking & Escape:** No new overlay. `admin.js`'s existing Escape and click-outside handlers ([`admin.js:137–150`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/admin.js#L137-L150)) are unchanged. Nav buttons are inside `.modal-content`, so they can't trip the `e.target === adminModal` backdrop check. ✅
- **Rapid-spam:** Tab switching is idempotent class toggling. Mashing a tab 20 times costs nothing. ✅
- **Offline / PWA:** No new asset unless §7 lands, and then `rewards_admin.js` → `ASSETS_TO_CACHE`. Bump `CACHE_NAME`, `style.css?v=`, and `app.js?v=`. `admin.js` has no `?v=` (it's imported), so the `CACHE_NAME` bump covers it. ✅
- **Verdict:** **PASS with 1 required mitigation** (TC30 must not pass vacuously).

---

### 🛡️ Consolidated Action & Implementation Checklist

1. **(Stage 3)** ~~Replace the Wipe confirm body~~ Done in Checkpoint 62 (D7). The redesign only restyles it with the R8-2 `.danger` modifier.
2. **(Stage 3 / 5)** Pane switching toggles classes only and never re-renders.
3. **(Stage 4)** Fix R8-1 through R8-4, and meet the `[style]` count = 0 acceptance criterion.
4. **(Stage 4)** R8-1 parity step, then bump the icon buttons to 42×42 as a separate step.
5. **(Stage 4)** Rule 4 shell, Rule 5 tracks, Rule 12 margin removal, and a Rule 13B yellow/charcoal active tab.
6. **(Stage 5)** TC30 activates the Schedule pane before measuring and asserts non-zero width.
7. **(Stage 5)** Add TC93 (§6.3). Keep all 26 IDs (25 + the D8 placeholder). Retire unused wrapper classes only after a grep.

---

## 6. Regression Contract

### 6.1 ID Audit: Every Static ID in `#admin-modal`

Measured by parsing `index.html:621–766` and counting exact-token references in `tests.js`, `app.js`, and `admin.js`.

| ID | `tests.js` refs | Wired in | New home |
|---|---:|---|---|
| `admin-modal` | 9 | admin.js | shell |
| `close-admin-header-btn` | 1 | admin.js | header |
| `close-admin-modal-btn` | 13 | admin.js | footer |
| `exceptions-btn` | 3 | app.js | Today |
| `admin-parent-grace-select` | 1 | app.js | Today |
| `admin-lock-past-days-toggle` | 1 | app.js | Today |
| `admin-week-start-select` | 8 | app.js | Schedule |
| `admin-week-start-status` | 3 | app.js | Schedule |
| `admin-timezone-select` | 1 | app.js | Schedule |
| `admin-idle-timeout-select` | 1 | app.js | Schedule |
| `admin-tasks-list` | 2 | admin.js | Tasks |
| `admin-add-task-btn` | 2 | admin.js | Tasks |
| `admin-save-tasks-btn` | 3 | admin.js | Tasks |
| `claimed-rewards-history-list` | 0 | admin.js | Rewards |
| `admin-profiles-list` | 1 | app.js | Children |
| `admin-new-passcode-input` | 1 | admin.js | Passcode |
| `admin-change-passcode-btn` | 1 | admin.js | Passcode |
| `admin-export-btn` | 0 | admin.js | Data |
| `admin-import-btn` | 1 | admin.js | Data |
| `admin-cloud-export-btn` | 1 | admin.js | Data |
| `admin-cloud-import-btn` | 1 | admin.js | Data |
| `admin-diagnostics-btn` | 1 | admin.js | Data |
| `admin-force-update-btn` | 1 | admin.js | Data |
| `toggle-debug-sidebar` | 1 | app.js | Data |
| `admin-wipe-btn` | 2 | admin.js | Data (quarantined) |
| `admin-chart-style-placeholder` *(D8, Checkpoint 62)* | 1 | — (inert) | Tasks |

The "~44 admin-area IDs" figure from the request corresponds to the wider sweep: **47** admin-related IDs are referenced by `tests.js`. The other 24 live outside `#admin-modal`: `#admin-btn`, `#edit-rewards-modal` and its children, `#add-profile-*`, `#profile-select-modal`, `#parent-grace-*`, `#exceptions-banner`/`-done-btn`, `#debug-sidebar`, and `#reward-select`/`#mega-reward-select`. **None of them move.**

Class selectors pinned by tests, all unchanged: `.admin-task-item`, `.admin-profile-item`, `.admin-profile-name`, `.delete-profile-btn`, `.edit-rewards-btn[data-id=…]`, and the `.reward-*` editor classes (TC57). No section heading text is asserted anywhere.

### 6.2 Test Cases That Must Change

| Test | Change | Why |
|---|---|---|
| **TC30** (Screensaver timeout) | Before the geometry asserts at L2476, click `[data-admin-section="schedule"]`. Add `assert(rWeek.width > 0, …)`. | Otherwise its three alignment asserts pass vacuously on zero rects (§5 Stage 5). |

**No other existing test needs to change.** Every other admin interaction uses `.click()`, `.value` + `dispatchEvent`, or DOM queries, and all of those work on hidden panes. The rewards editor tests (TC31, TC46, TC57) drive the stacked `#edit-rewards-modal`, which D5 leaves as it is.

### 6.3 New Test: TC93 (next number; TC89 was taken by D7/D8 in Checkpoint 62, TC90–TC92 in Checkpoint 63)

1. Open Admin with the passcode. Assert the Today pane is visible, the other 6 have `.hidden`, and exactly one `.admin-nav-btn` has `aria-selected="true"`.
2. Click each nav button in turn. After each click, assert that exactly one pane is visible and it matches `data-admin-section`.
3. **Home map:** each of the 25 IDs in §6.1 is `.closest('.admin-pane')` of its expected section. Shell IDs are outside every pane.
4. Switch to Tasks, rename a task input (without saving), switch to Rewards and back, and assert the typed value survived (no re-render).
5. Close and reopen Admin. Assert it opens on Today again (D6).
6. With `helpers.setProfilesList([...])` and `helpers.setActiveProfileId(…)`, assert that `#admin-scope-chip` text includes the active child's name. With no active profile, assert it has `.hidden`.
7. **Rule 8:** the `[style]` count = 0 criterion from §4.7, after rendering the profile rows, a delete confirm, and the rewards editor (empty and populated).
8. `#admin-customize-rewards-btn` opens `#edit-rewards-modal` titled for the active child.
9. The D8 placeholder lives in the Tasks pane. TC89 already covers the Wipe scope and the placeholder's inertness.

The mobile tab strip can't be resized reliably in the current harness. It's covered by the manual checks in §8.

---

## 7. Architectural Opportunity: Reward-Editor Extraction

### 7.1 Correcting the Cluster Boundary

Assessment §6.4 #1 names six functions (~314 lines). Brace-matched at `8a3e0e7`:

| Function | Lines | Actually |
|---|---|---|
| `renderRewardDropdowns` (2062, exported) | 15 | ❌ **Kid-facing.** Populates the main-screen `#reward-select` / `#mega-reward-select`. Called from render ([1350](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js#L1350)) and from the kid's reward pick ([2374](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js#L2374), [2381](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js#L2381)). Depends on `populateSelect` (2078), which the list omits. |
| `addRewardToHistory` (2110) | 15 | ❌ **Kid-facing.** The recent-rewards list for the main dropdown, called only from `bindRewardSelectEvents`. |
| `openEditRewardsModal` (4028) | 24 | ✅ editor |
| `renderEditRewardsLists` (4053) | 4 | ✅ editor |
| `renderRewardList` (4058) | 123 | ✅ editor |
| `bindRewardDragEvents` (4182) | 133 | ✅ editor |
| *`bindRewardsEditorEvents` (3049), missing from the list* | 89 | ✅ editor. It reassigns `editingProfileId`, `editingRewardState`, and `draggedRewardInfo`, and holds the Save path. |

**The true reward-*editor* cluster is five functions and about 373 lines**, in **two** places (L3049–3137 and L4028–4314). It also has five `let`s (L359–363) and four DOM refs (L294–299). `renderRewardDropdowns`, `populateSelect`, and `addRewardToHistory` **stay in `app.js`** with the kid-facing reward selection they serve.

### 7.2 Risk Evaluation

| Risk | Finding |
|---|---|
| **(a) Reassigned module-level `let`s** | **Neutralised by the corrected boundary.** `editingProfileId`, `tempWeeklyRewards`, `tempMegaRewards`, `editingRewardState`, and `draggedRewardInfo` are referenced **nowhere outside the five editor functions** (verified: only their declarations at L359–363 fall outside). They move into the new module as module-private state, and no cross-module reassignment is needed. `profilesList` and `activeProfileId` are only *read* by the cluster (plus in-place mutation of `profile.state`), but `app.js` and the test helpers *reassign* them, so they must be passed as **getters** (`getProfilesList: () => profilesList`), never as values. |
| **(b) `setSaveProfileRewardsMock` seam** ([`app.js:4353`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js#L4353), 5 test refs) | **Keep `saveProfileRewardsToCloudFn` in `app.js`** and inject `saveRewards: (...a) => saveProfileRewardsToCloudFn(...a)`. The late-binding arrow sees every mock swap. The same pattern already protects `setWipeDataMock`, `setExportCloudDataMock`, and `setImportCloudDataMock` through `admin.js` ([`app.js:1007–1009`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js#L1007-L1009)). `tests.js` stays unchanged. |
| **(c) Cache** | Add `./rewards_admin.js` to `ASSETS_TO_CACHE` and bump `CACHE_NAME`. It's imported by `app.js`, so it gets no `index.html` tag and no `?v=`. |
| **(d) Call order** | `app.js` imports `bindRewardsEditorEvents` and calls it in the **same slot** of `setupEventListeners()`. An ESM function import is a live binding that's never reassigned, so this is safe. |
| **(e) Inbound calls** | `renderAdminProfilesList` ([833](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js#L833)) calls `openEditRewardsModal`, which becomes an imported call. The new `#admin-customize-rewards-btn` also calls it. |
| **(f) Import graph** | **Verified: no module statically or dynamically imports `app.js`.** The new module imports only `state.js` (`state`, `saveState`) and receives everything else through callbacks. It creates no cycle. |

### 7.3 Is `admin.js`'s `appCallbacks` the Right Template?

**Yes, with two amendments:**

1. **Getters, not snapshots,** for any `app.js` binding that gets reassigned (`profilesList`, `activeProfileId`). `admin.js` doesn't need this today (its callbacks are all functions), but this module would.
2. **Loud defaults.** `admin.js`'s no-op defaults (`renderState: () => {}` and so on, [`admin.js:13–22`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/admin.js#L13-L22)) silently swallow a missed wiring. The new module's defaults should `console.error('rewards_admin: <name> not injected')`, so the headless harness, which fails on console errors, catches it.

Proposed surface: `initRewardsAdmin({ getProfilesList, getActiveProfileId, saveRewards, renderRewardDropdowns, showCustomNotification })`, `export function openEditRewardsModal(id, name)`, and `export function bindRewardsEditorEvents()`.

### 7.4 Recommendation: Same Implementation Phase, Separate Commit, *Before* the Layout Work

- **Do it in the redesign's implementation phase.** Assessment §6.5 already names this redesign as the moment. D5 adds a new launcher (`#admin-customize-rewards-btn`) to exactly this domain, so extracting first means the new wiring lands in its final home and isn't moved later.
- **Keep it a separate commit, and make it a pure move.** Its acceptance test is *the unchanged suite passing with `tests.js` untouched* (TC31, TC46, and TC57 exercise the editor end to end). Keeping it apart from the markup change means a red suite points at one cause.
- **It's optional, not a gate.** If the implementation session runs long, ship the redesign without it. The redesign doesn't depend on it.

---

## 8. Implementation Order (when approved)

Each phase is its own local commit. Run `node run_headless_tests.js` after each one, and keep it 100% green.

| Phase | Scope | Verification |
|---|---|---|
| **0: Rule 8 class moves** | R8-1 (class only, 36×32 kept), R8-2, R8-3, R8-4. Wipe copy (§4.5). | CDP computed-style parity: 0 diffs on the profile buttons, delete card, empty list, and rewards add-row (the Checkpoint 60 method). Suite green. |
| **1: Reward-editor extraction** *(optional, §7)* | `rewards_admin.js`, `ASSETS_TO_CACHE` | Suite green with `tests.js` **unchanged**. `node --check`. `app.js` export count stays at 11 (`renderRewardDropdowns` stays). |
| **2: Shell + nav** | Markup regrouping into 7 panes, Rule 4 grid, nav switching in `admin.js`, scope chip, `#admin-customize-rewards-btn`, retire unused wrapper classes | TC30 update + TC93. Suite green. Numbering audit (`dupes:12` only). |
| **3: Intentional visual deltas** | Icon buttons 36×32 → 42×42 | Manual check on desktop, a 768px tablet, and a 360px phone. |
| **Wrap-up** | One `CACHE_NAME` bump plus `style.css?v=` / `app.js?v=` covering every phase shipped. README "Parent Admin" bullets. Checkpoint. | `pokemon-session-wrapup` |

**Manual checks (Phase 2/3):** desktop at 1280px (rail visible, only the pane scrolls, Close always visible); iPad portrait at 768px; phone at 360px (tab strip scrolls, active tab visible on open, landscape phone reaches every button); stacked rewards editor over the new shell; Set Exceptions → dock appears and Admin closes; delete the active child → Admin closes.

---

## 9. Open Follow-Ups (not in v1.0)

> [!NOTE]
> v2.0 (§11) schedules four of these five. The phase that closes each is noted inline.

- [x] **Hold-to-unlock for Wipe All Progress** (Rule 6). It needs a TC27 update, so it's deferred to keep v1.0 zero-regression. → **v2.0 Phase 5** (plus Delete child).
- [x] **Inline the rewards editor into the Rewards pane** (D5's alternative) once the extraction exists. It retires the `#edit-rewards-modal` wrapper (2 test refs). → **v2.0 Phase 4**, for the active child only; the wrapper is *kept* for non-active children (Q3).
- [ ] **In-panel child picker** (D3's rejected option), if parents find leaving Admin to switch children annoying in practice. It needs non-active profile read/write. → still deferred.
- [x] **Arrow-key roving focus** in the tablist (WAI-ARIA tabs pattern). Tab and Enter work in v1.0. → **v2.0 Phase 3**.
- [x] **Rule 8 sweep of the login, add-profile, and profile-select modals** *(z-index part done in v2.0 Phase 5; field-level inline styles remain.)* ([`index.html:768–830`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html#L768-L830)). → **v2.0 Phase 5** (inline `z-index` on `#guide-modal`, `#family-login-modal`, `#profile-select-modal`, `#add-profile-modal`).

---

## 10. Revision History

| Version | Date | Change |
|---|---|---|
| 0.1.0 | 2026-09-20 | Seed: problem statement, candidate sections, open questions. |
| 2.0.0 | 2026-09-29 | **UX revamp folded in (§11)** from the Batch 1 proposal (rev 2) and its feature-review panel (APPROVED WITH MITIGATIONS). Records: the owner-signed §8.0 reversals **Q1** (4-row form-factor strategy replaces D1's single 768 breakpoint), **Q2** (draft + sticky save bar; CSS dirty dot reverses §4.2), **Q5** (Chart Style placeholder to the bottom of Activities, reversing D8's placement), **Q11** (Passcode folded into Family, 6 → 5 tabs), and D5 via **Q3** (inline rewards editor for the active child; `#edit-rewards-modal` kept for non-active children). Records the **Q8 kid-visible change** (the past-day grace passcode prompt is restyled to match the Admin-entry prompt, under Stage 1 constraints: calm inline error, no animation/sound, autofocus + Enter kept, no red, no new fields) and the **AA-not-AAA** decision for admin Poké Blue (`#2a71d0` + white = 4.80:1; pressed `#1d4f90` = 8.2:1). Batch 1 (0a/0b + two owner follow-ons) shipped in Checkpoint 68; Batch 2 checklist in §11.6. |
| 1.2.0 | 2026-09-28 | Post-implementation amendment (crsjain): **Today + Schedule merged into one landing tab, 🗓️ Settings**, and **✅ Tasks** renamed to **✅ Activities** (6 tabs). The two sparse 3-control panes become two cards (*Tonight's Check-in*, *Week & Clock*) in `.admin-pane-grid`, which sits side by side when each card has ≥320px and stacks otherwise. Pane/tab IDs keep `today` so D6 (always open on the landing tab) is unchanged; `#admin-pane-schedule` / `#admin-tab-schedule` are removed. Set Exceptions stays the first control. TC30 now activates `today`; TC93 expects 6 panes and asserts the Schedule IDs are gone. |
| 1.1.1 | 2026-09-27 | Checkpoint 65. Wipe button renamed to "Reset This Child's Progress" and its hint reworded; TC89 pins the label. Schema line updated to V19. |
| 1.1.0 | 2026-09-25 | Checkpoint 62. D7: Wipe resets only the active child (shipped). D8: greyed-out Chart Style (under 5 / 5+) placeholder (shipped, inert). The redesign's new test is renumbered TC89 → TC90. |
| 1.0.0 | 2026-09-24 | Specced (Checkpoint 61). D1–D6 locked by crsjain. Per-child scope finding. Wipe blast-radius finding. Full ID and test audit. Rule 8 debt R8-1..4. 5-stage panel (Parent/UX weighted), APPROVED WITH MITIGATIONS. Reward-editor boundary corrected and extraction recommended as an optional separate commit. |

---

## 11. v2.0 — Parent Admin UX Revamp

Source: the rev 2 revamp proposal and its 5-stage panel review (Batch 1 session, `conv 242849bf`). This section is now the canonical spec; the proposal artifacts are historical. Where §1–§9 conflict with this section, **this section wins**.

### 11.1 Goals

1. Nothing unsaved in Admin can reach the kid chart, the stars or Firestore (done in 0a).
2. One visual dialect for Admin: rationed colour, one primary per card, red only in danger — while staying Pokémon (charcoal frame, pixel shadows, yellow selected tab).
3. Tablet-first layout that never collapses the pane (Q1).
4. The nightly path — passcode → *Set Exceptions* → toggle → Done → chart — never gets longer.

### 11.2 Owner decisions (locked 2026-09-28/29, crsjain)

| # | Decision |
|---|---|
| Q1 | Form-factor priority: **tablet (portrait + landscape) → desktop → phone**. Phone landscape keeps the 0b CSS fix. |
| Q2 | **Draft + sticky Save bar.** No auto-save. |
| Q3 | Rewards for a non-active child: **keep the pop-up `#edit-rewards-modal`**, restyled. The active child edits inline in the Rewards tab. |
| Q4 | **Reorder activities with ▲▼** (active tasks only). |
| Q5 | Chart Style placeholder moves to the **bottom of Activities**. |
| Q6 | Multi-device: merge by id + error on conflict. No co-editing UI. |
| Q7 | **Keep "Set Exceptions" and "EDIT MODE".** |
| Q8 | **Restyle BOTH passcode prompts** (Admin entry *and* the kid-side grace prompt). Shipped in Batch 1. |
| Q9 | Add child from Admin **does not switch profiles**: toast and stay. |
| Q10 | No file backups for now. Clipboard codes stay; an **in-app restore dialog** replaces `prompt()`. |
| Q11 | **Fold Passcode into Family** (6 → 5 tabs). |
| Q12 | **2-second hold** on Delete child and Reset progress, with a keyboard equivalent. |
| Q13 | **Poké Blue `#2a71d0`** is the primary colour, **Admin surfaces only**. |
| Q14 | Ship in **two batches**: Batch 1 = 0a + 0b (deployed, Checkpoint 68); Batch 2 = Phases 1–5. |

**Batch 1 owner follow-ons (binding for Batch 2):**
- Secondary buttons are **tonal blue** (`#e3edfb` fill, `#1d4f90` text, `#2a71d0` border + pixel shadow). Admin form fields are **flat** (1.5px `#7d8ca3` border, inset shadow, left-aligned, visible label). Never white buttons that read as fields (`1edba3a`).
- Children/Family rows keep **labelled "Edit Rewards" and "Delete"** text+icon buttons and the green **"Active"** pill (`fac4c0e`).

### 11.3 Reversals of v1.x (owner-signed)

| v1.x decision | v2.0 | Signed by |
|---|---|---|
| D1 single 768px breakpoint | Portrait tablets ≤834px get top tabs (0b); short landscape gets the single-column grid; Rule 4's 1000px/80vh applies at wide sizes only | Q1 |
| §4.2 no nav badges | 8px CSS `::after` dirty dot on the tab (label text unchanged) | Q2 |
| D5 stacked rewards modal | Inline editor for the active child; modal kept for non-active children | Q3 |
| D8 placeholder at top of Activities | Bottom of Activities (markup and ID unchanged) | Q5 |
| Stage 3 "Passcode is its own tab" | "Parent passcode 🔑" card inside Family, with findability cues (§11.6 #4) | Q11 |

**Kid-visible change (Q8):** the past-day grace passcode prompt is restyled to match Admin entry. Stage 1 constraints: title "Parent passcode 🔑", **Unlock** (blue) / **Cancel** (tertiary ≥44px), no red, a calm inline wrong-code line (no animation or sound; field cleared and refocused), autofocus and Enter-to-submit kept, no new fields. Every other kid dialog (Switch Day?, Reset Week, badges, level-up, shop) is unchanged and each phase's capture pass proves it.

**Contrast decision:** admin Poké Blue with white text is **4.80:1 — WCAG AA, not AAA**. Accepted for Admin (a parent surface). Pressed/focus `#1d4f90` is 8.2:1 (AAA). The yellow selected tab (charcoal on `#ffcb05`) stays AAA.

### 11.4 Design system

- **Tokens** on `#admin-modal, [data-surface="admin"], #password-modal`: `--adm-ink #1e293b`, `--adm-ink-2 #475569`, `--adm-line #e2e8f0`, `--adm-primary #2a71d0` / pressed `#1d4f90`, `--adm-danger #dc2626`, `--adm-dock rgba(30,41,59,.96)`, focus `2px solid #1d4f90` offset 2 (`:focus-visible`, by specificity, never `!important`). Spacing 4·8·12·16·24 via `gap` only (Rule 12). Targets ≥44px.
- **Buttons:** `.adm-primary` (≤1 per card), `.adm-secondary` (tonal blue), `.adm-tertiary` (Cancel/Close/Discard, bordered, 44px), `.adm-danger` (danger cards and destructive confirms only). Yellow is never a button in Admin.
- **Components (Phase 1):**
  - `.adm-card` (+ `--danger`, `--muted`): white, 2px `--adm-line`, radius 12, padding 16, gap 12, with a **scope eyebrow** (`[data-admin-scope-eyebrow]`: "This child · Kepler", "Whole family", "This device"). Aliases kept: `.admin-action-group`, `.danger-zone-section`.
  - `.adm-row`: label + helper left, control right (220px, TC30), stacks on narrow panes.
  - `.adm-list-row`: ≥56px, leading control, left-aligned 2-line text, ≤1 labelled action + delete.
  - Pane content column max 720px.
- **Icons:** the SVG sprite is **deferred** (not in Batch 2); existing inline SVGs stay.

### 11.5 Behaviour spec

**IA (Phase 3):** `🗓️ Settings · ✅ Activities · 🎁 Rewards` | `👥 Family · 💾 Data`. Section ids stay `today`, `tasks`, `rewards`, `children`, `data`. `#admin-tab-passcode` / `#admin-pane-passcode` are removed; `#admin-new-passcode-input` and `#admin-change-passcode-btn` move into Family, plus the new `#admin-new-passcode-confirm`. Family has `title="Children & parent passcode"` and a rail sub-label. Tabs use roving arrow-key focus (←/→/↑/↓, Home/End).

**Save model:**

| Surface | Model |
|---|---|
| Settings | Auto-save on change with an inline "Saved ✓" (`aria-live=polite`). Confirm-gated controls show "Saved ✓" only after the confirm resolves. |
| Activities (Phase 2) | DOM draft. **Dirty = differs from `state`** (not "touched"). Dark sticky save bar `#admin-activities-savebar` ("● N unsaved changes", Discard, Save). Tab gets `data-dirty` → CSS dot. |
| Rewards (Phase 4) | Temp arrays + temp selection; Save/Cancel inline for the active child. |
| Passcode | Explicit submit; inline errors; success toast. |

**Unsaved-changes guard:** every Admin close goes through one `requestCloseAdmin()` chokepoint — ✕, footer Close, Esc, backdrop, *Set Exceptions*, Android back. When clean it is a no-op (the nightly path is unchanged). When dirty: **Save & close** (primary) / **Keep editing** (default focus; also what Esc and backdrop do) / **Discard** (tertiary). A failed save keeps Admin open with the draft. Tab switches never trigger it.

**Toast:** `.notif-modal.toast`, body-level, keeps the `h2` / `.notif-body-text` / `.notif-close-btn` contract, `role=status`, 4s auto-dismiss (paused on hover/focus), replaces any previous toast, no backdrop, never blocks Esc. **Routine success only** (Activities saved, Rewards saved, Passcode updated, code copied). Errors stay modal with "Got it".

**Dialogs:** `role=dialog`, `aria-modal`, `aria-labelledby`. On open, focus the first field (or the least destructive button in confirms). Tab is trapped in the top admin layer. Focus returns to the opener on close. Escape goes to the top layer only; Esc inside an inline edit cancels that edit and stops propagation.

**Data (Phase 1):** "Restore from code" (no ellipsis — it read as truncated) opens `#admin-restore-dialog` (textarea, inline JSON validation, Restore primary / Cancel), then the existing single destructive confirm. Exports that can't reach the clipboard show the same dialog read-only. `#admin-force-update-btn` becomes **"Reload latest version"** with a confirm and an offline guard (disabled with "You're offline"). Family backup helper: "Includes the parent passcode. Store it privately." Debug toggle moves under "Advanced ▸".

**Family (Phase 3):** "+ Add child" (`#admin-add-child-btn`) opens `#add-profile-modal` over Admin with **no second passcode prompt**; on create, a toast ("Lyra added. Switch from the profile picker.") and the active profile does **not** change — `selectProfile()` is never called under an open Admin.

**Rewards (Phase 4):** the editor subtree is re-parented (one DOM node, IDs stay unique) into `#admin-pane-rewards` for the active child, and back into the restyled `#edit-rewards-modal` for a non-active child launched from a Family row.

**Safety (Phase 5):** `holdToConfirm` (2s, visible ring from frame 1, Space/Enter hold, `aria-describedby` "Press and hold for 2 seconds") on **Delete child and Reset This Child's Progress only**. Test seam overrides the duration. ~~Exceptions dock gains an optional secondary **"↩ Admin"** that re-prompts for the passcode~~ — **removed 2026-09-30** (owner: extraneous next to Done ✅). Done ✅ is the dock's single action and lands on the chart; to get back to Admin, reopen it normally (passcode).

### 11.6 Batch 2 required mitigations (from the panel review)

- [x] 1. **Nightly-path proof:** open Admin → visit Activities without editing → *Set Exceptions* → no guard, dock shows.
- [x] 2. **One `requestCloseAdmin()` chokepoint** incl. `startExceptionMode`; Keep editing on Esc/backdrop via `{backdrop:'cancel'}`; other `showCustomConfirm` callers unaffected.
- [x] 3. **Save bar never covers the last row** (pane `padding-bottom` ≥ bar height) and never steals focus. Toasts for routine success only. *(The bar is the pane's last in-flow sticky child, so at full scroll it sits below the last row.)*
- [x] 4. **Passcode findability:** tab `title` + rail sub-label, card "Parent passcode 🔑", visible without scroll at TP/TL with 2 children. TC93 updated for 5 tabs. *(Phase 3: heading visible without scroll at TP, TL, desktop and phone even with 3 children; TC93 + TC100.)*
- [x] 5. **2s hold only on Delete child and Reset progress**, keyboard hold, ring from frame 1, `{hold:0}` test override. *(Phase 5: `holdToConfirm` in admin.js + `showCustomConfirm({ hold: 2000 })`; linear fill instead of a ring, visible from the first frame; Space/Enter hold; `aria-describedby` hint; suite-wide `setHoldDurationMock(0)`, real hold in TC102. The shop hold was not extracted — kid code untouched.)*
- [x] 6. ~~**"↩ Admin" is secondary**, re-prompts the passcode; Done ✅ stays primary.~~ *(Shipped in Phase 5, then **removed 2026-09-30** at the owner's request; TC102 step 6 now asserts the button is absent and Done ✅ is the only dock button.)*
- [x] 7. **Escape layering** handles inline edits (stopPropagation); Android back via `pushState`, tested. *(Android back + guard Esc: Phase 2 / TC99. Inline reward-rename Esc stops propagation and returns focus to the row: Phase 4 / TC97 step 5.)*
- [x] 8. **Reorder active tasks only**; inactive positions kept; a historical week's row order is unchanged after a reorder; TC58 cleanup removes by id. *(Phase 2, TC99: retired tasks keep their array index and a past week's row **set** is unchanged. Active tasks shown in a past week do follow the new order, because the grid renders in array order; fully frozen history order would need a persisted per-week order and a schema migration — not done. TC58 no longer pops: its draft is discarded through the guard.)*
- [x] 9. **Phase 3 responsive ahead of Phase 4** — satisfied by the 0b portrait-tablet top-tab fix. `viewport-fit=cover` is **not** shipped without the kid-HUD safe-area padding and capture (deferred).
- [x] 10. **Phase 4 re-parenting** keeps IDs unique; the non-active-child sheet keeps its modal asserts; Add child never calls `selectProfile()` under Admin. *(Phase 4: one `#rewards-editor` subtree moves between `#admin-rewards-editor-host` and `#edit-rewards-modal`; TC101 asserts unique IDs, the sheet for a non-active child, and Esc under the sheet. Add child: TC100.)*
- [x] 11. **Rule 8 sweep:** inline `z-index` removed from `#guide-modal`, `#family-login-modal`, `#profile-select-modal`, `#add-profile-modal`. *(Phase 5 / TC102; also the confirm checkbox row. Other kid-side inline styles — login/add-profile fields, debug sidebar, Guide button — remain.)*
- [x] 12. **Fold into this PRD** (v2.0, this section + revision row).

### 11.7 Test impact

- **New:** TC98 (Phase 1: restore dialog, toast, reload guard, focus), TC99 (Phase 2: guard + nightly path + dirty dot + reorder), TC100 (Phase 3: 5 tabs, Family passcode, add child without switch, roving focus), TC101 (Phase 4: inline rewards + sheet), TC102 (Phase 5: hold + Rule 8; step 6 asserts ↩ Admin is absent since 2026-09-30). Numbers are assigned as each lands; run the §0 audit.
- **Changed:** TC16/TC24 (`window.prompt` → `setReadBackupCodeMock`), TC1/TC58 (toast contract; guard on dirty close; cleanup by id), TC93 (5 tabs, placeholder below the list, guard at step 5), TC96/TC97 (close helpers and customize-button path), TC50 (confirm field), TC57/TC31/TC46 (inline editor for the active child), TC23/TC27/TC89 (hold override).
- **Schema:** none. **Cache:** every phase bumps `CACHE_NAME`, `style.css?v=`, `app.js?v=` and all importmap entries (TC90).

### 11.7 Post-Batch 2 refinement — Activities summary rows (2026-09-29)

A Staff UX review found the Activities tab hard to read: every row was always a form, drawing about 40 outlined boxes for five activities. It chose **Option A**:

- Each row reads as **emoji tile · bold name · grey one-line instructions**, then ▲▼, ✏️ and 🗑.
- ✏️ opens **one row at a time** into the flat labelled fields. It becomes a ✓ Done button with `aria-expanded`.
- The rows sit on the same pale well as the Rewards lists.
- The fields stay in the DOM, so the draft model, Save bar, dirty dot and guard are unchanged.
- A new activity, an empty-name error or a save conflict opens the row concerned.
- ▲▼ are borderless tertiary icons and keep their 44px targets.
- On phones (≤520px) the actions wrap to their own line.
- Covered by TC104. Only ✏️ enters edit mode; tapping the row does not. This avoids opening a row by mistake near ▲▼.

### 11.8 Post-Batch 2 refinement — Settings list rows (2026-09-29)

A Staff UX review found the Settings tab spread out horizontally. A short colon label sat far from a control that was pushed to the opposite edge of the 720px card, and a full-width Set Exceptions button sat on top. It chose **Option A**: settings list rows.

- Each row shows a **bold sentence-case name**, with a **grey helper line** under it and a compact control on the right. Rows are split by 1px hairlines, matching the rhythm of Children and Activities.
- Every helper line has an id, and its control points to it with `aria-describedby`. Selects use a real `<label for>`.
- **Set Exceptions** is now the first row ("Tonight's exceptions"). It is content-width (min 200px) and stays the only primary button on the tab. The old "💤 Rest day · ✨ Bonus" legend is folded into the helper line.
- Copy changes:
  - The Parent Edit Window tooltip is now visible helper text.
  - "App Timezone" → "Time zone".
  - Time zone options are shortened to fit the 220px select, e.g. "Automatic (device)" and "Pacific (US & Canada)".
- On phones (≤520px), select rows and the exceptions row stack, with full-width controls. The switch stays inline.
- The styles are scoped to `#admin-pane-today`, so the Data tab's `.adm-advanced` rows are unchanged. Covered by TC105.
