# Plan: style.css cleanup (light path)

**Status:** P0, P1 and P2 done (2026-11-01). P3 is next.
**Owner:** crsjain. **Goal:** make `style.css` faster and safer to edit, for the owner and her
agents, **without changing how anything looks**.

---

## 1. Why

`style.css` grew from 6,201 to 11,379 lines between 2026-09-24 and 2026-10-31. It is now 281 KB,
with 306 `!important` declarations and 53 `@media` blocks.

The real problem is layering, not length:

1. **The theme skin (L9729–11380) overrides older base rules.** Agents find the base value by searching, edit it, and nothing changes.
2. **Escalating `!important` rules (Rule 14 cell skins → column state → Big Buttons → Unicorn hearts) mean every fix needs another `!important`.**

Audit at commit `042d169`:

- **The skin rules are the real base.** `index.html` L159 sets `data-theme` before any markup, and nothing ever removes it. So the 302 bare `body[data-theme] …` selectors apply to both themes all the time. Only 12 selectors are Unicorn-only.
- **Dead code under the skin:**
  - 269 base rules are overridden by a skin rule.
  - 116 base declarations are fully shadowed (the skin restates the exact selector and property).
  - 15 base rules are dead outright.
- **About 170 `!important`s are one escalation chain.** Many set `pointer-events` and `cursor`, so they decide what a child can tap, not only how things look.
- **Unreferenced code:**
  - 47 dead rules (about 295 lines) use 30 classes/IDs that no module or `index.html` uses.
  - 4 custom properties are unused: `--shadow` and `--sk-warn-bg`/`-fg`/`-lip`.
  - 22 selectors are duplicated in the same `@media` context, with 19 shadowed declarations.
- **Test pins:** 132 `getComputedStyle` checks in 24 test cases pin computed values. They don't pin selectors.

## 2. Owner decisions (2026-11-01)

| # | Decision |
|---|---|
| D1 | Take the **light path** recommended by the Senior Staff Engineer review: dead code, then shadowed base values, then navigation markers. The full rebuild is deferred (§5). |
| D2 | Commit the screenshot **scripts** to the repo (`tools/css_rig/`), but **not the screenshots**. Screenshots go to `~/.cache/kpc-css-rig/`, 723 screens and about 190 MB, and any commit can regenerate them. The scripts are not in `ASSETS_TO_CACHE`. |
| D3 | **Improve the screenshot check before any CSS change.** Add 2× density (tablet), Exception Mode, Fix last week + grace dock, superseded columns, boot skeleton, forced hover/active/focus, a seeded Great Ball/Crown and a "Not on the plan" day, `cursor`/`pointer-events`/`touch-action` in the fingerprint, and a lint for things Chrome can't see. |
| D4 | No visual change, in both themes, both chart styles and past weeks. UX guidelines stay binding. |

Not chosen: (a) the full in-place rebuild, (b) a split into 6 files, (c) the rebuild plus an
`admin.css` split. The review found the fold saves only about 1,000 lines, not 2,000. Unwinding
`!important` changes tap behaviour that screenshots can't see. And splitting adds versioned
requests without removing any fights.

## 3. Gate for every phase

A phase is committed only when all of these hold:

1. **Screenshots.** Run `node tools/css_rig/capture.js <phase>-after`, then `node tools/css_rig/compare.js baseline <phase>-after`.
   - It must exit 0: no lint errors, and nothing beyond raster noise (at most 16 px with identical computed styles).
   - Always compare against the original `baseline` (§6), not the previous phase, so drift can't build up.
2. **Tests.** `node run_headless_tests.js` is 100% green.
3. **Cache busting** (AGENTS.md §6.1): bump `CACHE_NAME` and `style.css?v=` in `index.html`.
4. **One local commit per phase** (or sub-phase), staging explicit paths. No push; deploy only through `pokemon-session-wrapup` on the owner's say-so.

Safari/iPad guardrails (the rig is Chrome-only; `compare.js` lints for these):

- Never delete a vendor-prefixed line (`-webkit-backdrop-filter`, `-webkit-appearance`, …) as a "duplicate".
- Never merge selector lists that contain a vendor pseudo (`::-webkit-slider-thumb`, `::-moz-range-thumb`, `::-webkit-scrollbar*`). A browser that doesn't know the pseudo drops the whole rule.
- Never touch `@keyframes` bodies. The rig freezes animations, so a broken one would not show.

## 4. Phases

| Phase | Work | Est. lines | Est. `!imp` | Risk |
|---|---|---:|---:|---|
| P0 | This plan, `tools/css_rig/`, the new baseline | 0 | 0 | None |
| P1 | Dead code and duplicates | −300 to −400 | −0 to −5 | Low |
| P2 | Delete base declarations shadowed by the skin; add a skin header | −150 to −300 | 0 | Low–medium |
| P3 | Section markers and an AGENTS.md map | +40 | 0 | None |

End state is about 10,700–10,900 lines. The bigger win: what an agent finds by searching is the value that's actually live, and it can jump straight to an area.

### P0: plan, rig and baseline. ✅ 2026-11-01

- [x] Senior Staff Engineer review of the first plan (conv `b0a761e9`); owner decisions D1–D4.
- [x] `tools/css_rig/capture.js`, `compare.js`, `README.md`. The rig serves the repo on :8000 directly and blanks `tests.js` through CDP.
- [x] Rig improvements from D3.
- [x] Baseline captured: 723 screens at `042d169` (the P0 commit ships no app change). An A/A re-run showed 0 changes and 8 screens within raster noise. The Fix-last-week countdown text is pinned so it stays deterministic.
- [x] Plan committed before any CSS change.

### P1: dead code and duplicates. ✅ 2026-11-01

- [x] Deleted 48 rules whose every selector uses an unreferenced class/ID.
  - Includes `.day-total-count` and `.coming-soon-tag`, which `tests.js` only asserts are absent.
  - Tokens inside `:not()` don't count as dead.
  - Kept the dynamic families (`badge-theme-N`, `type-*`).
  - Removed the comments that only described the deleted rules.
- [x] Deleted `--shadow` and `--sk-warn-bg`/`-fg`/`-lip`, in both themes.
- [x] Duplicates: deleted 19 earlier declarations that a later rule with the same selector and `@media` restates.
  - Two rules emptied this way were deleted whole.
  - No rule was moved or merged.
- [x] Gate:
  - Suite green (35 s).
  - Compare: 723 screens, 0 changes, lint ok.
  - One Fix-last-week phone screen showed 64 px with identical computed styles. Three re-captures were byte-identical to the baseline: a one-off render-timing blip.
  - Cache `v273`, `style.css?v=11.36`.
- **Result:** `style.css` 11,380 → 10,980 lines (−400), `!important` 306 → 296, `@media` 53 → 52.
- Lessons:
  - The rig caught a bad intermediate attempt, where removing an emptied rule left half a selector list attached to the next rule. Its computed-style diff flagged the superseded cells even though the pixels matched.
  - `compare.js`'s vendor-prefix lint now keys by rule, so deleting a whole dead rule is info, not an error.

### P2: base values shadowed by the skin. ✅ 2026-11-01

- [x] Deleted 132 base declarations, 12 of them as whole rules, using the rule below. Script: `scratch/p2.js` in conv `9c83646b`.

  A base declaration was deleted only when all of these held:
  - **Every** selector in its list has a `body[data-theme] <same selector>` skin twin.
  - The twin sets the same property name.
  - The skin's `@media` chain is a subset of the base's, so the skin applies whenever the base does.
  - The base is not `!important` unless the skin is too.
  - The skin value uses no newer feature, which would make the base value a fallback.

  The areas covered:
  - Panels and cards (`.app-container`, header, trainer/badge/Mega cards, chart, bottom section).
  - Grid header.
  - Shop, level-up and showcase modal shells.
  - Most of the old Big Buttons look: tray, ribbon, pills, Vault tile, cards, emoji, the compact rhythm.
- [x] The skin stayed in place. No skin rule was moved or edited.
- [x] Added a "SKIN LAYER" note to the skin banner: it wins for both themes, so edit values there.
- [x] Removed 1 comment that only described a deleted rule.
- [x] Gate:
  - Suite green (34.5 s).
  - Compare: 723 screens, 0 changes, 13 within raster noise, lint ok.
  - Cache `v274`, `style.css?v=11.37`.
- **Result:** 10,980 → 10,807 lines (−173), `!important` 296 → 295.
- **Cumulative:** 11,380 → 10,807 (−573), `!important` 306 → 295.

### P3: navigation for agents

- [ ] Add a greppable marker at each area: `/* @section <name>: <one line> */`.
  - Names: `tokens`, `header-cards`, `grid`, `cells-rule14`, `daily-total`, `modals-base`, `admin-legacy`, `column-states`, `admin-shell`, `vault`, `badge-case`, `exception-mode`, `guide`, `login-profiles`, `shop`, `showcase`, `grace-dock`, `boot`, `admin-revamp`, `big-buttons`, `skin-unicorn-checkbox`, `skin`, `skin-modals`.
- [ ] A short index comment at the top of `style.css` listing the section names (no line numbers, which go stale).
- [ ] AGENTS.md §2: the same map, plus "search `@section <name>`, then read that range; values in the skin sections override earlier ones".
- [ ] Gate (§3). Comments only, so the screenshots must be byte-identical. Commit.

## 5. Deferred (not planned; pick up only when a feature already touches that area)

| Item | Why deferred | Before starting |
|---|---|---|
| Fold the skin into base rules | About −1,000 lines; changes specificity in states the rig doesn't show | Add rig states for the area; per-area sub-phases |
| Unwind the cell-skin `!important` chain (~170) | Controls tapping (`pointer-events`) in Exception Mode, superseded and past weeks; screenshots can't see it | Add `elementFromPoint` tap asserts to `tests.js` for Exception Mode × rest/bonus/superseded |
| Regroup by area and merge `@media` (53 → ~25) | Moving rules can change winners between equal-specificity rules | Do it only after the fold |
| Split out `admin.css` | Admin sits in 4 places and interleaves with modal rules; little agent benefit once P3 exists | Needs its own `<link ?v=>`, an `ASSETS_TO_CACHE` entry and TC90 changes |

## 6. Baseline

- `~/.cache/kpc-css-rig/baseline/`, captured at `042d169` with the P0 rig.
- It covers 5 viewports (1366×1024, 1180×820, 1180×820@2, 768×1024, 390×844) × 2 themes, with main, past, modal, admin, state and pseudo screens.
- **Regenerate if lost:** `git stash` or check out the P0 commit, run `node tools/css_rig/capture.js baseline`, then return. The fixed clock makes this independent of today's date.

## 7. Log

- 2026-10-31: audit and options (conv `9c83646b`).
- 2026-11-01: Senior Staff Engineer review (conv `b0a761e9`); decisions D1–D4; P0; P1; P2.
