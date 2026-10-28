# CHECKPOINT 82

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Unicorn & Princess Sparkle theme, Phase 1** (`235796b`): implemented [`prd_unicorn_princess_theme.md`](prd_unicorn_princess_theme.md) as a per-child `state.theme` (`'pokemon'` | `'unicorn'`), set from a new **Look & Feel** card in Admin › 🗓️ Settings (`#admin-theme-select`, auto-saves with "Saved ✓"). The theme changes:
  - colors;
  - the check-off icons: dormant outline heart → glowing heart; a Royal Crown medallion replaces the Great Ball;
  - titles and labels, via `getThemeCopy()` / `applyThemeUI()`;
  - confetti colors.

  It adds **TC127**. There's no schema bump.
- [x] **Color review of the unicorn look** (decision only, nothing built):
  - The owner felt the activities box looked grey and the buttons were off. A Senior Staff UX Designer review rendered three palette options from the real app (pass 1).
  - The owner then shared the Pokémon skin they're planning: a saturated sky behind white 26px cards, no charcoal frames, candy lips, pill accent buttons, a yellow "today" color.
  - Pass 2 rebuilt the unicorn options on that structure; the recommendation was "Twilight Unicorn".
- [x] **Ownership split for the final look** (owner decision 2026-10-28, `907cd79`): the design thread `f05c83c6` (`app_visual_directions.html`, `unicorn_theme_directions.html`) will code the final look for **both** Pokémon and Unicorn. The handoff spec is PRD §10: what exists, a shared token skin, guardrails, color-pinned tests, the screenshot rig. Only one thread edits the repo at a time.
- [ ] **Owner manual test of theme switching**: test plan in this session's artifacts (`~/.gemini/jetski/brain/ef7248c9-680b-4262-8e1e-8f882733a6a6/unicorn_theme_test_plan.md`). High-risk items:
  - Admin, the Exceptions dock and the PIN prompt stay un-themed.
  - A finished bonus shows the crown, not the Great Ball.
  - The theme is per child, with no wrong flash on profile switch.
  - The theme survives Reset Progress.
- [ ] **Prod acceptance (carried): Kepler's Thursday star**: Admin › Settings › `✏️ Fix Oct 11 - 17` → tick Thu Math → Star Vault streak Wed 10/14 → Fri 10/16.

### Known Follow-ups / Nice-to-haves

- [ ] **Final visual skin for both themes** (design thread, PRD §10): one shared, token-driven skin (`--sky/--card/--tray/--lip/--accent/--today`) with token sets per `body[data-theme]`. It replaces the Phase 1 unicorn palette block at the end of `style.css` but keeps the heart/crown SVG rules. It will change **Kepler's** chart too, so color-pinned tests (TC127, TC128) need deliberate updates. Nunito would need adding to the fonts `<link>`.
- [ ] **Baseline contrast failures in both themes**: `.pixel-btn.info` (`#4299e1`, white text) is 3.1:1 and Reset Week Grid (`.pixel-btn.warning`, `#f6ad55`, white text) is 1.9:1, both below WCAG AA. Expected to be fixed by the new skin.
- [ ] **Unicorn Phase 1 gaps** (expected, not bugs): grey Mega-slot Pokéball sprites; Pokémon-type emoji rings; Shop / Badge Case / Guide pop-ups get the copy swap only, not new colors.
- [ ] **Phase 2 (PRD non-goal)**: non-Pokémon unicorn/princess companions.
- [ ] Carried: Owner VQA of Big Buttons on the tablet; phone ribbon tight at ≤ 390px (accepted); canvas star shower ignores `prefers-reduced-motion`; **§7 Phase 3** (remove `adminPassword` from per-child state, V20, TC116, earliest 2026-10-26, re-verify the doc field in the console first); Mega slot "?" edge; claimed-rewards history shows stored values; T1–T6 test data expired; real-Firebase sign-out check; kid-side inline styles (Rule 8); `viewport-fit=cover`; test-harness sleep savings.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v248`**. Asset tags: `style.css?v=11.13`, `app.js?v=11.17` (+ all 14 importmap entries `?v=11.17`), `particles.js?v=10.5`.
*   **Admin Password**: family Parent PIN at `users/{uid}.adminPassword` (legacy fallback `"zxcv"`).
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`). Emulator login `crsjain+staging@gmail.com` / `food3333`.
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths. One thread edits the repo at a time (design thread `f05c83c6` owns the visual skin next).
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Test Suite**: **115 blocks, 114 unique numbers** (`dupes:12`; gaps 40, 43, 44; max **128**; TC116 reserved; next free **129**). `node run_headless_tests.js` ~38–41 s.
*   **Screenshot rig** (real app + injected CSS, both chart styles): `~/.gemini/jetski/brain/ef7248c9-680b-4262-8e1e-8f882733a6a6/scratch/shots/`. Serve `site/` on `:8010`, then run `node shoot.js <variants.json> 1366 1200`. Keep the viewport landscape: taller-than-wide switches the app to its portrait layout.

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 64 §3](checkpoint_64.md), apart from the per-child fields added since:

```javascript
chartStyle: 'standard', // 'standard' | 'big-buttons' (docs/prd_simplified_chart_style.md)
theme: 'pokemon',       // 'pokemon' | 'unicorn'   (docs/prd_unicorn_princess_theme.md)
```

**No schema version bump or migration.** `theme` is in `state`, `getDefaultStateTemplate()` and `WIPE_PRESERVED_KEYS`; `runStateDiagnostics` normalizes missing or invalid values to `'pokemon'`. V20 stays reserved for §7 Phase 3.

---

## 4. Work Accomplished

### Theme plumbing (`235796b`)
* **`state.js`**: `theme` default, `WIPE_PRESERVED_KEYS`, diagnostics self-heal.
* **`index.html`**:
  - New Look & Feel card with `#admin-theme-select` at the bottom of `#admin-pane-today`.
  - Dedicated copy targets: `#game-title-suffix`, `#trainer-title-prefix`, `#badges-title-suffix`, `#guide-title`, `#guide-subtitle-tail`, `#task-col-header-label`. These keep `.trainer-name-label` intact.
  - The motivational quote is collapsed onto one line.
* **`admin.js`**: change handler that saves, calls `renderState(true)` and flashes "Saved ✓".
* **`app.js`**:
  - `getThemeCopy(theme)` (selector → text map; a function, not a const, because `renderState` runs during module init and a const would hit the TDZ).
  - `applyThemeUI()` sets `body[data-theme]`, syncs the select and applies copy. It's called in `renderState`.
  - `document.title` follows the theme.
  - The export count stays at 11.
* **`particles.js`**: `UNICORN_COLORS` for daily and weekly/Mega celebrations when `body[data-theme="unicorn"]`.
* **`style.css`**: the `UNICORN & PRINCESS SPARKLE THEME` block at the end of the file:
  - palette and headers (active stays dark text on rose-gold, Rule 13B);
  - data-URI SVG dormant/glowing hearts and the crown medallion (36×36, Rule 14), with a purple `+XP` pill;
  - superseded cells show a greyscale heart; rest and off-plan cells are unchanged;
  - Admin is untouched.

### Docs
* **`docs/prd_unicorn_princess_theme.md`**: status, checklist, implementation notes, and **§10 Phase 1b visual polish handoff** (`907cd79`).
* **`README.md`**: Chart Theme bullet.

### Tests
* **`tests.js` TC127**:
  - default + diagnostics self-heal;
  - Admin select auto-save + "Saved ✓";
  - copy swaps keep the child's name;
  - unchecked/checked heart SVGs differ, 36×36, Pokéball halves hidden;
  - tick records and adds XP;
  - bonus dashed ring `rgb(147, 51, 234)` → crown (`facc15`, no Great Ball `ef4444`), 36×36;
  - active header text `rgb(30, 41, 59)`;
  - Admin primary stays `rgb(42, 113, 208)`;
  - the theme survives a wipe;
  - switching back is lossless (grid and XP unchanged).

  Setup gotchas: a tick is silently reverted unless `state.reward` and `state.megaReward` are set; `.day-header` has a 0.2s color transition, so finish animations before sampling.

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_82.md`](checkpoint_82.md): this checkpoint.

### Edited Files
* [`state.js`](../state.js), [`admin.js`](../admin.js), [`app.js`](../app.js), [`particles.js`](../particles.js): theme plumbing.
* [`index.html`](../index.html): Look & Feel card, copy-target spans, `?v=11.17` / `style.css?v=11.13` / `particles.js?v=10.5`.
* [`style.css`](../style.css): unicorn theme block.
* [`service-worker.js`](../service-worker.js): `poke-chart-cache-v248`.
* [`tests.js`](../tests.js): TC127.
* [`docs/prd_unicorn_princess_theme.md`](prd_unicorn_princess_theme.md): status, notes, §10 handoff.
* [`README.md`](../README.md): Chart Theme bullet.

---

## 6. Validation Instructions

1. **Cache**: hard-refresh and confirm `poke-chart-cache-v248`.
2. **Switch Lyra**: Admin › 🗓️ Settings › Look & Feel › 🦄 Unicorn & Princess. "Saved ✓" shows, the chart turns pink/purple, and Admin stays Poké Blue.
3. **Copy**: check "Lyra's Royal Unicorn Chart", "PRINCESS Lyra", "ROYAL GEM BADGE", "👑 ROYAL CROWN PROGRESS", "ROYAL QUEST", and the Case / Guide / Shop titles.
4. **Icons**: today's outline hearts turn into glowing hearts when ticked (+5 XP). A ✨ bonus (set via Set Exceptions) shows a purple dashed ring, then a gold crown with `+XP` when ticked. 💤 is unchanged.
5. **Big Buttons**: switch Chart Style to Big Buttons. The cards show big hearts; the wobble, sound and star shower still work.
6. **Per child**: Switch Trainer → Kepler stays Pokémon. Back to Lyra is still Unicorn. A reload keeps it.
7. **Lossless**: switching the theme back and forth never changes XP, stars or ticks.
8. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass (115 blocks).
