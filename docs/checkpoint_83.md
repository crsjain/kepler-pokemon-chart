# CHECKPOINT 83

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Final look for both themes** (PRD §10.7, `bc55ab8`): one shared, token-driven skin replaced the Phase 1 unicorn palette block.
  - **Pokémon Center (B)** applies to both kids by default.
  - **Pastel Castle (U1)** applies on `body[data-theme="unicorn"]`.
  - Changes: borderless frame, 26px white panels, candy lips, pill kid buttons, blue gem / Jewel Box Vault, and Fredoka + Nunito fonts.
  - Kid button contrast is fixed: Reset Week Grid is now dark text on amber, and `.info` buttons use `#1d4ed8` / `#7e22ce`.
  - Every rule is scoped to kid containers, so Admin is untouched.
  - The owner approved this from screenshots.
- [x] **Past weeks in Big Buttons** looked editable. The owner reviewed 3 + 3 options and picked **"B3"**, with **no "Back to Today" banner** (owner decision).
  - The look matches the Standard grid's past weeks: white readable cards with no lip, and balls/hearts at 45% with an SVG padlock.
  - The focused day pill gets a grey ring, never today-yellow.
  - Code: `.is-past-week` on `.chart-container`, set by `renderSimplifiedView()`. Test: **TC129**.
  - Recorded in `prd_simplified_chart_style.md` §3.5 and UX Rule 13.5.
- [x] **Grid first-column padding**: 16px left inset on `th.task-col-header` / `td:first-child`, matching the Prev button. It was 4–10px.
- [x] **Hearts off-centre** in the grid. Root cause: the ring was a CSS `border` and the heart a `background-image`, and they snapped to pixels separately on fractional column x positions (±0.5px at 1×). Fix: the ring is now drawn inside the same SVG (`background-origin: border-box`, transparent 3px border keeps 36×36). The checked heart keeps the original **three** sparkles (owner).
- [x] **Copy** (owner): Unicorn keeps **"Change Partner"** ("Partner" is used app-wide). The Vault tile label stays **"Vault"** in both themes, matching the Star Vault modal; only the Jewel Box *icon* differs.
- [x] **Chart Style moved** from Activities to **Settings › Look & Feel**, as a `🧸 Chart style` row under `🎨 Chart theme`. Same ID / auto-save. TC93 §9 and TC128 updated.
- [x] **Daily Total row (Standard grid)**:
  - The ❌ is boxed like the stars.
  - **Size hierarchy**: earned star 30px > ghost 26px > ❌ ~21px. Owner: "celebrate the stars instead of penalizing".
  - Stars are aligned **optically**, lifted via wrapper `translateY` (−2px / −1.6px). This is recorded in UX Rule 15.
  - The Vault is a mini gem tile, `.grid-vault-tile`: 60×48px, calm, no glow.
- [x] **Big Buttons same height as Standard**: compact rhythm (ball 56, pills/vault 52, emoji 52, gaps 8, cards flex 64–84px). Result: 537px with 4 activities (same as Standard), 539px with 5. See `prd_simplified_chart_style.md` §3.6.
- [x] **One spacing rhythm**: 16px between every panel, 12px inside the bottom panel, trimmed page padding. At 1366×1024 the app is about 95px shorter (845px). Recorded in UX Rule 12.
- [ ] **Owner VQA on the tablet** of all of the above (both kids, both chart styles, a past week).
- [ ] **Prod acceptance (carried)**: Kepler's Thursday star via Fix last week.

### Known Follow-ups / Nice-to-haves

- [ ] **Crown sparkle**: the white glint was moved top-left during the (wrong) symmetry fix. Asked the owner whether to restore it to top-right; no answer yet.
- [ ] **Unicorn day title** still starts with ⚡ (built in JS); the U1 mockup used ✨.
- [ ] **Goal column at ~1024px landscape** is tight on the right (2–9px inset). Not addressed.
- [ ] **UX-guideline clauses from PRD §10.7** still partly unwritten: card/background contrast rule, R5 transparent scroll tracks on sky, R14 heart matrix, "theme = tokens + checkbox skin + copy".
- [ ] Rest stripes stay slate in the *grid* for Unicorn (lavender-grey only on Big Buttons cards). Deliberate (Rule 14).
- [ ] Carried: Unicorn Phase 1 gaps (grey Mega-slot sprites, Shop/Badge/Guide pop-ups copy-only); Phase 2 companions; phone ribbon tight ≤ 390px; star shower ignores `prefers-reduced-motion`; **§7 Phase 3** (V20, TC116); Mega slot "?" edge; claimed-rewards history shows stored values; real-Firebase sign-out check; kid-side inline styles (Rule 8); `viewport-fit=cover`; test-harness sleep savings.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v257`**. Asset tags: `style.css?v=11.22`, `app.js?v=11.20` (+ all 14 importmap entries `?v=11.20`), `particles.js?v=10.8`. The app label is still `v1.8.0 (v58)`.
*   **Admin Password**: family Parent PIN at `users/{uid}.adminPassword` (legacy fallback `"zxcv"`).
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`). Emulator login `crsjain+staging@gmail.com` / `food3333`.
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Test Suite**: **116 blocks, 115 unique numbers** (`dupes:12`; gaps 40, 43, 44; max **129**; TC116 reserved; next free **130**). `node run_headless_tests.js` ~38–49 s.
*   **Screenshot / measurement rig** (conv `2aa9b995`): `~/.gemini/jetski/brain/2aa9b995-140c-49bf-8838-721f541b2a85/scratch/rig/`. Serve `site/` on `:8011` and run `./mkindex.sh` after any `index.html` change.
    - `shoot.js` / `shoot_hist.js`: env `THEMES`, `STYLES`, `HIST=1`, `CROP=<selector>`, `DPR`; per-variant `js`.
    - `measure.js`: insets.
    - `align.js`: heart vs ring, from real pixels.
    - `vtotal.js` / `vgeo.js`: Daily Total optical centres.
    - `heights.js`: chart heights.
    - `gaps.js`: panel spacing.
    - `centroid.js`: SVG ink centroid.

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 82 §3](checkpoint_82.md) (`chartStyle`, `theme` per child). **No schema bump or migration this session.**

---

## 4. Work Accomplished

### Shared theme skin (`bc55ab8`)
* **`style.css`**: the `SHARED THEME SKIN` block.
  - `--sk-*` tokens on `body[data-theme]` (B) and `body[data-theme="unicorn"]` (U1).
  - Shared rules for the frame, panels, buttons, grid, Big Buttons and the bottom panel.
  - The Phase 1 palette (116 lines) is removed; the heart/crown rules are kept.
  - Every selector is prefixed with its kid container. A bare `.level-badge` rule also restyled the partner showcase modal and broke a font assertion.
* **`index.html`**: Fredoka + Nunito fonts. An inline `<script>` right after `<body>` sets `data-theme="pokemon"` before boot. TC92 regex-pins the exact `<body class="app-booting">`, so it can't be an attribute.
* **`app.js`**: theme copy for `#open-badges-btn` (🏆 Case / 👑 Gem Case).

### Follow-up polish (this commit)
* **`app.js`**:
  - `renderSimplifiedView()` toggles `.is-past-week`.
  - Grid Vault markup is now `.grid-vault-tile` (icon + "Vault" label, aria/title "Star Vault").
  - "Change Partner" in both themes; the Vault label override is removed.
* **`index.html`**: Chart Style row moved into the Look & Feel card; cache tags bumped.
* **`style.css`**:
  - B3 past-week rules.
  - First-column inset.
  - Ring-in-SVG hearts (three sparkles).
  - Daily Total size hierarchy + optical lift.
  - Grid Vault tile.
  - Big Buttons compact rhythm.
  - One 16px / 12px spacing rhythm.
  - Look & Feel segmented width.

### Docs
* **`docs/prd_simplified_chart_style.md`**: §3.1 move note, §3.5 past weeks, §3.6 compact rhythm.
* **`docs/prd_unicorn_princess_theme.md`**: §10.6 skin box ticked; "Change Partner" and "Vault" decisions.
* **`_agents/rules/ux-guidelines.md`**: Rule 12 panel rhythm, Rule 13.5 Big Buttons past weeks, Rule 15 star/❌ size hierarchy and optical alignment.
* **`README.md`**: Chart Style location, Big Buttons Vault/past weeks/compact height, shared look.

### Tests
* **TC127**: sky, panels, plum title, amethyst kid buttons, Reset contrast, Admin not reskinned, "Change Partner", "👑 Gem Case".
* **TC128**: Vault is a navy-lipped gem (not charcoal), white to-do card + blue lip, white bonus to-do, striped rest, U1 Jewel Box / blush done / Rule 13B pill, "Vault" label. It now opens the Settings tab for Chart Style.
* **TC93 §9 / home map**: Chart Style lives in Settings › Look & Feel under Chart theme.
* **TC129 (new)**: past-week Big Buttons (flat white cards, 45% balls, padlock, grey focus ring, no banner, rest without padlock, unicorn parity, cleared on return).

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_83.md`](checkpoint_83.md): this checkpoint.

### Edited Files
* [`style.css`](../style.css): shared skin + all polish above.
* [`app.js`](../app.js): theme copy, `.is-past-week`, grid Vault tile markup.
* [`index.html`](../index.html): fonts, default `data-theme` script, Chart Style row in Look & Feel, cache tags.
* [`service-worker.js`](../service-worker.js): `poke-chart-cache-v257`.
* [`tests.js`](../tests.js): TC93, TC127, TC128 updates; TC129.
* [`docs/prd_unicorn_princess_theme.md`](prd_unicorn_princess_theme.md), [`docs/prd_simplified_chart_style.md`](prd_simplified_chart_style.md), [`_agents/rules/ux-guidelines.md`](../_agents/rules/ux-guidelines.md), [`README.md`](../README.md).

---

## 6. Validation Instructions

1. **Cache**: hard-refresh and confirm `poke-chart-cache-v257`.
2. **Kepler, Standard**:
   - Sky-blue backdrop and white panels.
   - First column inset 16px.
   - Daily Total: bigger gold stars than ❌s, on one line; blue gem Vault tile.
3. **Lyra, Unicorn**:
   - Pink/lavender sky.
   - Checked hearts centred in their rings, with three sparkles.
   - "Change Partner"; Big Buttons Vault = jewel box labelled "Vault".
4. **Big Buttons**:
   - The panel is the same height as the Standard grid (4–5 activities).
   - ◀ Prev: cards turn flat white with faded balls/hearts + padlock, and the focused day has a grey ring.
5. **Spacing**: 16px between every panel; the bottom panel is compact. The whole app fits a 1366×1024 landscape tablet.
6. **Admin › Settings › Look & Feel**: Chart theme + Chart style rows. Admin stays Poké Blue.
7. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass (116 blocks).
