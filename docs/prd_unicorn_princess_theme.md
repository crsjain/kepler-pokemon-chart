# PRD: Unicorn & Princess Sparkle Theme (Per-Child Visual, Checkbox & Copy Theme)

**Document**: `docs/prd_unicorn_princess_theme.md`
**Version**: 1.0.0
**Status**: Phase 1 implemented locally (2026-10-26; cache v248, modules 11.17, style 11.13, particles 10.5; **TC127**). Not yet deployed.
**Authors**: crsjain & Jetski
**Target Systems**: `state.js`, `app.js`, `admin.js`, `index.html`, `style.css`, `tests.js`. **No schema version bump** (stays V19; V20 remains reserved for `prd_parent_pin_and_family_signin.md` §7 Phase 3).
**Companion docs**: [`prd_simplified_chart_style.md`](prd_simplified_chart_style.md) (independent per-child `chartStyle` setting), [`prd_rest_day_passes_and_bonus_tasks.md`](prd_rest_day_passes_and_bonus_tasks.md) (checkbox state matrix), [`prd_column_state_machine.md`](prd_column_state_machine.md) (8-state column visual hierarchy), [`prd_admin_panel_redesign.md`](prd_admin_panel_redesign.md) (§11 Admin design system), [`_agents/rules/ux-guidelines.md`](../_agents/rules/ux-guidelines.md).

---

## 1. Problem & User Context

The chart was originally built around a single **Pokémon Training** theme tailored to Kepler (7yo). His younger sister, Lyra (5yo), is not as interested in Pokémon battle/catching imagery — she loves **pink, purple, unicorns, sparkly things, hearts, and princesses**.

Without a per-child theme option:
- Lyra's chart feels borrowed from her brother's world rather than designed for her.
- Red Pokéballs and cobalt-blue Great Balls lack the immediate emotional delight that glowing hearts, royal crowns, and sparkles bring to a 5-year-old who loves princesses and unicorns.

 At the same time, both siblings share the same household routine, nightly parent check-ins, Star Vault economy, Weekly Badge milestones, and 4-week Mega Milestone rewards. The theme must transform the sensory experience for Lyra without fracturing the underlying state model or reward math.

---

## 2. Goals & Non-Goals

### Goals (Phase 1 — Visual, Checkbox & Copy Reskin)
- **Per-Child Theme Setting (`state.theme`)**: Support `'pokemon'` (default) and `'unicorn'` (`🦄 Unicorn & Princess`) independently per child profile.
- **Orthogonal to Chart Style**: Keep `state.theme` (`'pokemon' | 'unicorn'`) completely independent from `state.chartStyle` (`'standard' | 'big-buttons'`) so Lyra can use the Unicorn & Princess theme in the simplified view now and keep her theme when she later graduates to the standard 7-day chart.
- **Sparkly Pink / Lavender / Royal Purple Palette**: Transform the child-facing background, cards, headers, XP bar, and celebration accents via `document.body.dataset.theme = 'unicorn'` in `style.css`.
- **Heart & Royal Crown Checkbox Iconography**:
  - **Normal Unchecked**: Dormant crystal/lavender outline heart inside the 36px circle (or 56px in Simplified View).
  - **Normal Checked**: Glowing Pink/Magenta Royal Heart (`💖`) with golden 4-point sparkles.
  - **Bonus Checked**: Faceted Amethyst & Rose **Royal Crown / Unicorn Gem** (`👑`) replacing the Great Ball, with a Royal Purple `+XP` badge.
- **Princess / Unicorn Terminology Reskin**: Dynamically update child-facing titles, subtitles, card headers, and motivational copy while preserving 100% of the underlying XP, Star Vault, Weekly Badge, and Mega Milestone math.
- **Parent Domain Quarantine**: Keep the Parent Admin Panel (`#admin-modal`), Parent PIN prompt (`#password-modal`), and bottom floating docks in their neutral Poké-Blue/Slate palette (`_agents/rules/ux-guidelines.md` Rule 17).

### Non-Goals (Deferred to Phase 2)
- **Custom Non-Pokémon Companion Roster**: Phase 1 keeps the existing `pokemon_data.js` companion/badge IDs and progression math so switching themes is instant and lossless. Dedicated non-Pokémon unicorn/princess companion sprites and evolution trees will be evaluated in **Phase 2** once Phase 1 is live.
- **Kindness Quests**: Not rolled out; ignored per owner decision.

---

## 3. User Experience & Visual Design System

### 3.1 Parent Admin Entry Point (`Admin › 🗓️ Settings`)
In `#admin-pane-today` (inside a new or existing per-child card), add a standard `.adm-setting-row`:
- **Label**: `🎨 Chart theme` (`<label for="admin-theme-select">`)
- **Help text (`#admin-theme-help`)**: *"Colors, check-off icons, and titles for this child's chart."*
- **Select (`#admin-theme-select.pixel-select`)**:
  - `<option value="pokemon">⚡ Pokémon Training</option>`
  - `<option value="unicorn">🦄 Unicorn & Princess</option>`
- **Save behavior**: Auto-saves on `change` (matching `#admin-parent-grace-select`, `#admin-timezone-select`, and `#admin-idle-timeout-select`), triggers `flashAdminSaved(adminThemeSelect)` (`Saved ✓`), updates `document.body.dataset.theme`, and re-renders.
- **No Kid-Facing Theme Toggle**: Children cannot switch themes from the main screen, preventing bedtime stalling.

### 3.2 Color Palette & Contrast Tokens (`body[data-theme="unicorn"]`)
All child-facing colors override via CSS variables and `[data-theme="unicorn"]` selectors in `style.css` (zero inline `style="..."` attributes, UX Rule 8):

| Surface / Element | Pokémon Theme (`default`) | Unicorn & Princess Theme (`unicorn`) | Contrast Check (UX Rule 13B) |
| :--- | :--- | :--- | :--- |
| **Page Background** | Sky Blue gradient (`#a8dadc` → `#457b9d`) | Enchanted Blush-Lavender gradient (`#fce7f3` → `#e9d5ff` → `#f5d0fe`) | Decorative canvas |
| **Card Frame & Border** | Cream/White + Charcoal (`#2d3748`) | Pearl Blush (`#fffbfd`) + Deep Royal Plum (`#4a1d66`) | High-contrast 3px retro border |
| **Primary Header Banner** | Poké Red / Yellow / Blue | Royal Magenta (`#db2777`) & Amethyst (`#7e22ce`) with Gold (`#fde047`) title accent | ≥ 5.4:1 with white text |
| **Active Day Column Header** | Pikachu Yellow (`#ffcb05`) + Dark Charcoal (`#1e293b`) | **Sparkle Rose-Gold (`#fde047` / `#fbcfe8`) + Deep Plum-Charcoal (`#1e293b`)** | **≥ 9.8:1 (WCAG AAA — never white text)** |
| **Selectable Day Header** | Poké Blue (`#2a71d0`) + White (`#ffffff`) | **Royal Amethyst (`#7e22ce`) + Solid White (`#ffffff`)** | **6.4:1 (WCAG AA/AAA)** |
| **XP Progress Bar Fill** | Emerald Green / Electric Blue | Shimmering Pink-to-Violet gradient (`#ec4899` → `#a855f7` → `#facc15`) | High visual excitement |
| **Parent Admin (`#admin-modal`)** | Poké Blue (`#2a71d0`) + Slate | **Unchanged** (Parent Domain Quarantine, UX Rule 17) | Preserves TC97 / Admin v2.0 |

### 3.3 Checkbox State Matrix in `unicorn` Theme (UX Rule 14)
All states preserve the locked `36px × 36px` circular footprint in the weekly grid (and scale cleanly to `56px × 56px` in Simplified View) using pure CSS `background-image: url("data:image/svg+xml,...")` rules on `.pokeball`:

1. **Normal Unchecked (`.checkbox-cell input:not(:checked) + .pokeball`)**:
   - `36px` circle with `3px solid #4a1d66` (Deep Plum) border and `#fdf2f8` blush fill.
   - Centered **Dormant Crystal Outline Heart** (`#f3e8ff` soft lavender fill, `#9333ea` stroke).
   - `::before` and `::after` Pokéball hemispheres hidden (`display: none`).
2. **Normal Checked (`.checkbox-cell input:checked + .pokeball`)**:
   - `36px` circle with `3px solid #4a1d66` border and soft radial glow (`#fdf2f8` → `#fbcfe8`).
   - Centered **Glowing Magenta-Pink Royal Heart (`#ec4899` / `#db2777`)** with specular highlight and golden 4-point sparkles (`#fde047`).
3. **Rest Day (`.checkbox-cell.rest-cell`)**:
   - Unchanged: non-clickable `💤` on diagonal stripes (`pointer-events: none`).
4. **Bonus Task Unchecked (`.checkbox-cell.bonus-cell input:not(:checked) + .pokeball`)**:
   - `3px dashed #9333ea` (Royal Purple dashed border) on `#faf5ff` lavender cell tint with centered `✨`.
5. **Completed Bonus Task (`.checkbox-cell.bonus-cell input:checked + .pokeball`)**:
   - Authentic vector **Royal Crown & Unicorn Gem Medallion SVG**:
     - Faceted amethyst-and-rose circular medallion (`#7e22ce` / `#ec4899`, outlined in `#4a1d66`).
     - Golden 3-peak Princess Crown (`#facc15` with `#ca8a04` shading and ruby/sapphire crown jewels) + sparkle glints.
   - Floating `+XP` pill badge (`::after`) styled in Royal Purple (`#7e22ce` background, `#3b0764` border, `#ffffff` text).
6. **Not on the Plan (`.checkbox-cell.out-of-range-cell`)**:
   - Unchanged: diagonal stripes + centered muted dash (`#94a3b8`), no checkbox shown.

### 3.4 Dynamic Copy Dictionary (`THEME_COPY`)
Applied declaratively via `applyThemeUI()` in `app.js` whenever `renderState()` runs:

| UI Element / Selector | `pokemon` (Default) | `unicorn` (Unicorn & Princess) |
| :--- | :--- | :--- |
| Main Title (`.game-header .title`) | `<Name>'s Pokémon Training` | `<Name>'s Royal Unicorn Chart` |
| Main Subtitle (`.game-header .subtitle`) | `"Gotta Catch 'Em All!"` | `"Sparkle, Practice & Shine! 💖"` |
| Trainer Card Eyebrow (`.trainer-title`) | `TRAINER <NAME>` | `PRINCESS <NAME>` |
| Change Partner Button (`#change-partner-btn`) | `Change Partner` | `Change Companion 🦄` |
| Weekly Badge Card Title (`.badge-title`) | `POKEMON BADGE` | `ROYAL GEM BADGE` |
| Mega Milestone Title (`.mega-title`) | `🔮 MEGA MILESTONE PROGRESS` | `👑 ROYAL CROWN PROGRESS` |
| Table Task Column Header (`.task-col-header span`) | `TRAINING TASK` | `ROYAL QUEST` |
| Partner Shop Title (`.shop-title`) | `Pokémon Partner Shop! 🏪` | `Magical Companion Shop! 🦄` |
| Badge Case Title (`#badges-modal h2`) | `<Name>'s Badge Case 🏆` | `<Name>'s Royal Gem Case 👑` |
| Task Guide Title (`#guide-modal h2`) | `Pokémon Training Guide 📖` | `Royal Practice Guide 📖` |
| Task Guide Subtitle (`.guide-subtitle`) | `Here is what <Name> needs to do to earn a pokeball for each task!` | `Here is what <Name> needs to do to earn a sparkle heart for each quest!` |
| Motivational Quote (`.motivational-quote`) | `"True Trainers never give up! Keep practicing and leveling up your skills!"` | `"True Princesses & Unicorn Riders never give up! Keep sparkling and learning every day! 💖✨"` |

---

## 4. Rules & Economy Invariants

1. **100% Shared Progression Math**: `XP_PER_TASK` (`5`), `XP_DAILY_BONUS` (`15`), `XP_BONUS_TASK` (`10`), `XP_LEVEL_THRESHOLD` (`100`), Star Vault streak tiers (`yellow` → `silver` → `blue` → `prism`), Weekly Badge rolls, and 4-week Mega Milestone counts are identical across themes.
2. **Lossless Theme Switching**: Toggling `state.theme` between `'pokemon'` and `'unicorn'` never alters `partnersData`, `starVault`, `collectedBadges`, `grid`, `excused`, or `weeklyHistory`.
3. **Preserved Across Reset Progress**: `'theme'` is included in `WIPE_PRESERVED_KEYS` (`state.js`) so "Reset This Child's Progress" keeps the child's chosen theme.
4. **Celebration Confetti Palette**: When `state.theme === 'unicorn'`, `particles.js` celebration bursts bias toward pastel & royal sparkle colors (`#ec4899`, `#f472b6`, `#a855f7`, `#c084fc`, `#fde047`, `#ffffff`).

---

## 5. Engineering Design

- **State & Diagnostics (`state.js`)**:
  - Add `theme: 'pokemon'` to `state` and `getDefaultStateTemplate()`.
  - Add `'theme'` to `WIPE_PRESERVED_KEYS`.
  - In `runStateDiagnostics()`, validate:
    ```js
    if (!['pokemon', 'unicorn'].includes(state.theme)) {
      state.theme = 'pokemon';
      issues.push("Missing or invalid theme.");
      fixed.push("Set theme to default 'pokemon'.");
    }
    ```
  - **No migration entry in `migrations.js`**: schema remains **V19** (`LATEST_SCHEMA_VERSION = 19`), keeping V20 free for §7 Phase 3 (`adminPassword` removal).
- **Theme Application (`app.js`)**:
  - Define `THEME_COPY` in `app.js` and a private `applyThemeUI()` called inside `renderState()`.
  - `applyThemeUI()` sets `document.body.dataset.theme = state.theme || 'pokemon'`, syncs `#admin-theme-select`, and updates the text nodes listed in §3.4 while preserving `<span class="trainer-name-label">`.
  - Keep `app.js` export count at **11** (pinned by TC69).
- **Admin Wiring (`admin.js` & `index.html`)**:
  - Add `#admin-theme-select` to `#admin-pane-today` (`Admin › 🗓️ Settings`) and register it in the auto-saving Settings list in `admin.js` (`flashAdminSaved`).
  - Update TC93's `HOME.today` list in `tests.js` if it checks explicit IDs, or verify `HOME` checks `HOME` array inclusion (TC93 checks a fixed list of IDs in `HOME`, so any new ID is automatically ignored unless added, and its `<select>` lives inside `#admin-pane-today`).

---

## 6. Automated Regression Test Plan — TC127

Add **Test Case 127: Unicorn & Princess Sparkle Theme (`state.theme`, CSS tokens, Heart/Crown checkboxes, and copy reskin)** in `tests.js`:
1. **Default & Diagnostics**: Verify default `state.theme === 'pokemon'` and `document.body.dataset.theme === 'pokemon'`. Set `state.theme = 'invalid'`, run `runStateDiagnostics()`, and assert it self-heals to `'pokemon'`.
2. **Admin Settings Selection**: Open Admin › Settings, change `#admin-theme-select` to `'unicorn'`, dispatch `change`, and assert `state.theme === 'unicorn'`, `document.body.dataset.theme === 'unicorn'`, and the inline `"Saved ✓"` indicator appears.
3. **Copy & Title Reskin**: Assert `.game-header .title` contains `"Royal Unicorn Chart"`, `.trainer-title` contains `"PRINCESS"`, `.badge-title` reads `"ROYAL GEM BADGE"`, and `.mega-title` contains `"ROYAL CROWN PROGRESS"`.
4. **Heart & Royal Crown Checkboxes (36px × 36px Invariant)**:
   - Unchecked normal cell: assert `getComputedStyle(pokeball).backgroundImage` contains `svg` (dormant crystal heart) and bounding rect is `36×36`.
   - Checked normal cell: tick a task, assert `getComputedStyle(pokeball).backgroundImage` updates to the glowing pink royal heart SVG, and XP increases by `+5`.
   - Checked bonus cell: mark a cell `'bonus'` and tick it; assert `getComputedStyle(pokeball).backgroundImage` renders the Royal Crown/Gem SVG (`36×36`).
5. **Contrast & Parent Quarantine Guardrails**:
   - Assert active column header text color in `unicorn` theme is dark (`rgb(30, 41, 59)`), never white.
   - Assert `#admin-modal` primary buttons keep Poké Blue (`#2a71d0` / `rgb(42, 113, 208)`).
6. **Wipe Preservation**: Run `buildWipedChildState(state)` and assert `wiped.theme === 'unicorn'`.

---

## 7. Owner Decisions

| # | Question | Decision |
| :--- | :--- | :--- |
| **Q1** | Depth of the Unicorn / Princess theme relative to Pokémon mechanics? | **Phase 1 visual + checkbox + copy reskin** (2026-10-25): pink/purple/sparkle palette, heart/crown checkboxes, princess/magic labels, keeping the same XP/star/badge math. Custom non-Pokémon companions deferred to Phase 2. |
| **Q2** | Should Theme and Chart Style be independent per-child settings? | **Yes, two independent settings** (2026-10-25) and two separate PRDs so Lyra can keep her Unicorn theme when she later graduates to the standard chart. |
| **Q3** | What replaces the Pokéball and Great Ball checkboxes in the Unicorn theme? | **Dormant outline heart → Glowing Pink/Magenta Heart with gold sparkles** when checked, and a **Royal Crown / Unicorn Gem** (instead of Great Ball) for completed bonus tasks (2026-10-25). |
| **Q4** | How should Kindness Quests be handled? | **Ignore Kindness Quests** (2026-10-25) — that feature was not rolled out. |

---

## 8. 🏛️ 5-Stage Feature Review Panel Synthesis

### 🚦 Final Executive Verdict: **APPROVED WITH MITIGATIONS** (All mitigations folded into §§3–6)

#### Stage 1: 🧸 Child Development & Play Psychologist
- **Cognitive & Scan Friction**: High-contrast transformation from dormant lavender crystal heart (unchecked) to vivid magenta heart with gold sparkles (checked) gives a 5-year-old instant visual feedback without reading a word.
- **Emotional Safety & Sibling Harmony**: Because both themes run on the exact same XP/Star/Badge economy, Lyra's chart feels equally prestigious to Kepler's Pokémon chart.
- **Mitigation Added**: Preserve calm setback notices (`"🔒 BADGE LOCKED AGAIN"` / `"🔄 TIME TO TRAIN"`) with encouraging royal/magic microcopy.
- **Verdict**: **PASS**

#### Stage 2: 🎮 Game Economy & Habit Loop Designer
- **Chore Priority Integrity**: Zero new mini-games or side loops that could cannibalize daily chore completion.
- **Currency & Progression Balance**: 100% lossless switching between `'pokemon'` and `'unicorn'`.
- **Verdict**: **PASS**

#### Stage 3: 🏡 Family Operations / "Weary Parent"
- **Bedtime & Screentime Impact**: Theme selection lives strictly in **Parent Admin › 🗓️ Settings** (`#admin-theme-select`) behind the Parent PIN, preventing kids from flipping themes back and forth at bedtime.
- **Parent Burden & Overrides**: Auto-saves on change with zero extra confirmation dialogs; preserved across progress resets (`WIPE_PRESERVED_KEYS`).
- **Verdict**: **PASS**

#### Stage 4: 🎨 Senior Staff UX Designer
- **UX Guidelines Compliance**:
  - *Rule 8 (Zero Inline Styles)*: Driven entirely by `body[data-theme="unicorn"]` in `style.css`.
  - *Rule 13B (Contrast Invariant)*: Active column header in `unicorn` theme uses Sparkle Gold/Blush with **Dark Charcoal/Plum text (`#1e293b`, >9.8:1 AAA contrast)** — never white text. Selectable column headers use Royal Amethyst (`#7e22ce`) with white text (`6.4:1`).
  - *Rule 14 (36px × 36px Checkbox Matrix)*: Pure CSS data-URI SVGs on `.pokeball` keep the exact 36×36 footprint and all 6 cell states.
  - *Rule 17 (Parent vs. Child Quarantine)*: `#admin-modal` and `#password-modal` remain in neutral Poké-Blue/Slate.
- **Verdict**: **PASS**

#### Stage 5: 🛠️ Senior Staff Engineer & Chaos Architect
- **Tech Debt & Complexity Audit**:
  - Zero schema version bump (stays V19 via `runStateDiagnostics` default healing, avoiding collision with reserved V20).
  - Zero DOM structure changes inside `renderGridTable()` — `.pokeball` appearance swaps purely via CSS `body[data-theme="unicorn"]` selectors.
  - Single `THEME_COPY` lookup table applied in `applyThemeUI()` avoids scattered `if (state.theme === 'unicorn')` branches.
  - `app.js` export count remains strictly 11 (TC69).
- **Gaps & Edge Cases Caught**:
  - `.game-header .title` contains nested `<span class="trainer-possessive"><span class="trainer-name-label"></span>'s </span>` — `applyThemeUI()` must update only the trailing text node (or a dedicated `<span id="game-title-suffix">`) so `.trainer-name-label` is never wiped out on profile switch!
  - Offline PWA resilience: all heart and royal-crown checkbox graphics are inline `data:image/svg+xml` in `style.css`, requiring zero network fetches.
- **Verdict**: **PASS**

---

## 9. Rollout Checklist

- [x] Brainstorm & lock owner decisions Q1–Q4 (2026-10-25)
- [x] Draft PRD & run 5-Stage Feature Review Panel (2026-10-25)
- [x] Implement Phase 1 (`state.js`, `index.html`, `admin.js`, `app.js`, `particles.js`, `style.css`) (2026-10-26)
- [x] Add automated regression test **TC127** in `tests.js` and verify 100% green `node run_headless_tests.js` (2026-10-26)
- [x] Bump `CACHE_NAME` in `service-worker.js` and `?v=` in `index.html` (TC90) (v248 / 11.17)
- [ ] Owner visual QA on the tablet (Lyra's profile, both chart styles)

### Implementation notes (2026-10-26)
- Admin control sits in a new **Look & Feel** card at the bottom of Settings (`#admin-theme-select`), auto-saving like the other selects.
- Copy swaps target dedicated elements (`#game-title-suffix`, `#trainer-title-prefix`, `#badges-title-suffix`, `#guide-title`, `#guide-subtitle-tail`, `#task-col-header-label`) so `.trainer-name-label` is never touched. `getThemeCopy()` is a function, not a module-level const, because `renderState` runs during module init (TDZ). `document.title` follows the theme too.
- Big Buttons: hearts and the crown reuse the grid selectors and scale to the existing 64px catch ball (58px at <= 520px), not the 56px noted in §3.3.
- Superseded cells show a greyscale heart; rest 💤 and the off-plan dash are unchanged. Kid-facing modals (Shop, Badge Case, Guide) get the copy reskin only; their palettes stay as-is in Phase 1.
