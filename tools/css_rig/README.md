# CSS visual regression rig

Two scripts that prove a CSS change looks **identical** before and after. Built for the
style.css cleanup ([`docs/plan_style_css_cleanup.md`](../../docs/plan_style_css_cleanup.md)),
reusable for any refactor that must not change how the app looks.

Not shipped: these files are not in `ASSETS_TO_CACHE` or `index.html`. Screenshots are written
**outside the repo** (default `~/.cache/kpc-css-rig/<tag>/`, override with `CSS_RIG_OUT`), because
a full run is ~720 screens, ~190 MB and any commit can regenerate it.

## Use

```bash
python3 -m http.server 8000                       # same server the test suite needs
node tools/css_rig/capture.js before              # at the commit you start from
# ...edit style.css...
node tools/css_rig/capture.js after
node tools/css_rig/compare.js before after        # exit 0 = no visual change
```

Options: `--vps=1366x1024,1180x820@2` (`@2` = 2× pixel density, like a tablet),
`--only=main,past,modal,admin,state,pseudo`, `--themes=pokemon,unicorn`.
Env: `CSS_RIG_CDP_PORT` (default 9271; the test suite uses 9223), `CSS_RIG_BASE` (default
`http://127.0.0.1:8000`). One capture at a time per port.

## What it captures

At 1366×1024, 1180×820, 1180×820@2, 768×1024 and 390×844, in both themes:

- **main / past**: main screen and last week, Standard and Big Buttons (full page).
- **modal**: 15 modals plus a scrolled-to-bottom shot when they scroll.
- **admin**: the 5 Admin tabs, also scrolled to bottom (Pokémon theme only, since Admin looks the same in both).
- **state**:
  - Parent Exception Mode (both chart styles).
  - Fix last week with the grace dock.
  - Superseded (hatched) columns.
  - Boot skeleton.
- **pseudo**: `:hover`, `:active` and `:focus-visible` forced on tappable things (buttons, day headers, Pokéballs, Big Buttons cards, pills, Vault tiles).

The seeded week includes:

- done and missed days
- a completed bonus (Great Ball / Crown) and an open bonus ✨
- a rest day 💤
- a "Not on the plan" day (State 7)

Every screen also saves a **computed-style fingerprint** (37 properties plus `::before`/`::after`
for every visible element). It includes `cursor`, `pointer-events` and `touch-action`, which
decide what a child can tap, and which a screenshot cannot show.

The run is made deterministic in four ways:

- fixed clock (Wed 2026-10-28 10:00)
- seeded `Math.random`
- remote sprites replaced with one fixed image
- animations and transitions snapped to their end state, canvases hidden

`tests.js` is blanked through the Chrome DevTools Protocol, so the app boots in test mode without running the suite.

## How compare decides

1. **Lint** of the saved CSS copies. Each check guards against something Chrome can't see:
   - **No vendor-prefixed declaration may disappear.** For example, `-webkit-backdrop-filter` keeps the blur on iPads.
   - **No `@keyframes` may change**, since animations are frozen in the screenshots.
   - **No new selector list may mix a vendor pseudo (`::-webkit-…`) with other selectors.** A browser that doesn't know the pseudo drops the whole rule.
2. **Screens**: byte-identical PNGs pass. Otherwise pixels and fingerprints are diffed.
   - **Raster noise:** at most 16 changed pixels with identical computed styles counts as noise. This is backdrop-blur jitter seen when the same commit is captured twice.
   - **Anything else is a change.**

Limits: Chrome only. iPad WebKit differences are covered only by the lint. Run the suite too.
