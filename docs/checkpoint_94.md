# CHECKPOINT 94

This document contains a complete, chronological record of user requests, system
configurations, version progress, and active schema definitions for the
application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Star Vault shop button: "single animation" instead of pulsing forever** (CP90 follow-up #1). The ready button now plays one `shop-ready-pop` (0.9s scale + fading yellow ring, `backwards` fill so hover/press still work; none under reduced motion). Commit `d9ed02b`, TC139.
- [x] **Activity icon picker for Admin › Activities** (CP90 §1, approved 2026-11-07). PRD + mockup first (`d618851`). Owner: keep 🪥; in-row popover on phones. The panel was run at the owner's request; its mitigations were accepted. **Declined** (owner: "keep the app UX on the clean side… less clutter"): the duplicate-icon hint and keyboard helper text. Built as an in-row popover (`4597c80`).
- [x] **"Include 🉐 as one of the language emojis"** (after 福 was rejected by the emoji-only field). 57 curated icons. Commit `157add6`.
- [x] **Clearer error copy** for the Any emoji field (`ec889c3`); superseded the same day by search.
- [x] **"Swap in a standard emoji search function"**: search only, no category tabs, no recently-used row (owner). PRD §10 (`c07eca8`).
- [x] **"The emoji selector modal is cut-off in tablet mode"** (iPad landscape screenshot). UX recommendation: a stacked dialog over Admin instead of an adaptive popover (PRD §10.6, mockup `activity_icon_picker_dialog_mockup.html` in conv `33cfc8c4`). Owner: "Build". Commit `2867854`.
- [ ] **Owner check on the iPad after reloading to `v317`**: open the picker in landscape and portrait (whole dialog visible), search (e.g. "violin", "chinese"), paste an emoji from the emoji keyboard, and check the shop button pops once.
- [ ] **Carried from CP93:** tablet check at `v313` (day preview + yellow pill + Back to Today in both themes, Exception Mode headers, left cards with Milestones on/off, sparkles); CP92 tablet check at `v300`; CP91 phone checks; CP90 phone/tablet checks; CP88 milestones/Alden VQA; CP87 Week over manual test; CP86 visual check; CP85 tablet check; CP84 VQA; Kepler's Thursday star acceptance.

### Known Follow-ups / Nice-to-haves

- [ ] **TC133 flaked once** during this wrap-up ("The new chart has a fresh badge (got 25)"). It passed 3/3 alone and in the full rerun, and the full suite had passed 7 minutes earlier on the same commit. It's unrelated to this session's changes (Change Week Start Day / badge history); watch for a repeat, which could point to a wall-clock or ordering dependency.
- [ ] **Single Chinese characters (福) can't be icons.** The owner chose to add 🉐 to Languages instead of widening the field. Search's "No matches" covers it.
- [ ] **Search data is English-only** (emojibase `en`). The kid keyword list (`EXTRA_KEYWORDS` in `tools/build_emoji_data.js`) is small; add words there and regenerate if parents search for something that misses.
- [ ] **Emoji ≤ 14 cap** follows the 🪥 / iPadOS 15.4 floor. If all family tablets move to iPadOS 16.4+ (Emoji 15), raise `MAX_VERSION` and regenerate.
- [ ] **The dialog's fit is checked by screenshot**, at 1024×640 and 390×844. TC140 only asserts that it fits the headless viewport, because page JS can't resize the viewport.
- [ ] **Picking from search can't produce skin-tone variants** (they're excluded); pasting one still works.
- [ ] Carried from CP93: Standard grid keeps the old preview rules; Mega Milestone card can stretch; sparkles tap-to-burst deferred; sparkles invisible in the css rig; CP92 list (Ultra Necrozma branches / V20 `branchId`, scrollbar fix on a real device, Lyra can't read the Vault next-goal line, other inner scrolling lists); CP89 lazy forms; CP88 rest-day goal edge; CP87 list (`activeDay` shared across tablets, Admin Start a new week confirm, legacy badge title fallback, week-start consolidation edge, style.css cleanup items, phone Vault 50.5px, `#vault-debug-panel`, Goal column at ~1024px, Unicorn Phase 2, star shower ignores reduced motion, §7 Phase 3 V20 / **TC116** reserved, kid-side inline styles, `viewport-fit=cover`).

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo), Lyra (5yo) & Alden (under 5)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v317`**. Asset tags: `style.css?v=11.66`, `app.js?v=11.66` + all **16** importmap entries `?v=11.66` (new: `emoji_data.js`), `particles.js?v=10.8`. App label still `v1.8.0 (v58)`.
*   **Admin Password**: family Parent PIN at `users/{uid}.adminPassword` (legacy fallback `"zxcv"`). Never commit backup codes.
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`).
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Test Suite**: **131 blocks, 130 unique numbers** (`dupes:12`; gaps 40, 43, 44; max **144**; TC140 now used; TC116 reserved; next free **145**). `node run_headless_tests.js` ~36 s, ~3,860 asserts.

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 88 §3](checkpoint_88.md). **No schema bump or migration.** The icon is still a plain string in `task.emoji`; custom or searched icons are stored as-is.

---

## 4. Work Accomplished

### Star Vault: one "ready!" pop
* **`style.css`**: `.pixel-btn.ready-to-unlock` plays `shop-ready-pop` once (0.3s delay, `backwards` fill); keyframes keep the candy lip (`--sk-cta-warm-lip`); `prefers-reduced-motion` → none. It replays whenever the Vault opens (display:none → shown) or the child crosses 5 stars.

### Activity icon picker (`docs/prd_activity_icon_picker.md`)
* **`admin.js`**:
  - `TASK_EMOJI_GROUPS` (7 groups, 57 icons) and `TASK_EMOJI_CHOICES` (flattened).
  - Helpers: `normEmoji` / `isCuratedEmoji` (match ignoring U+FE0F) and `parseSingleEmoji` (one emoji grapheme with emoji presentation).
  - Open rows get `.adm-emoji-tile-btn`. The `<select class="task-emoji-select">` stays hidden as the value store: `setRowEmoji` adds an option if needed, sets the value and dispatches a bubbling `change`, so the draft, Save bar and guard are untouched.
  - The dialog: `openEmojiPicker` / `renderEmojiPickerBody` / `searchEmoji` / `pickEmoji` / `closeEmojiPicker` / `bindEmojiPicker`, with lazy `import('./emoji_data.js')` (retried after a failure).
  - Search hits that match a curated icon use the curated spelling.
  - Closing: the scrim via `bindBackdropDismiss`, ✕, and a capture-phase Escape.
  - It's registered in `isLayerAboveAdminOpen()` and `topAdminLayer()`, so Tab stays inside it.
  - It closes on list re-render, row close, delete and tab switch.
* **`index.html`**: `#admin-emoji-dialog` (`.modal` > `.adm-dialog.adm-emoji-dialog`: header with current icon + activity name + ✕, `#admin-emoji-search`, `#admin-emoji-body`); importmap entry for `emoji_data.js`.
* **`style.css`**:
  - Tile button in the Activities block.
  - `#admin-emoji-dialog` (z-index 190000 like the restore dialog): top-aligned, `max-height: calc(100dvh - 32px)` with a `vh` fallback, only the body scrolls, transparent scrollbar track.
  - Cells are 52px (48px ≤ 520px), with `:active` press. The current icon uses a border ring and focus uses an outline, so the two stay distinct.
* **`emoji_data.js`** (new, generated): 1,849 emoji (Emoji ≤ 14, no skin tones, components or lone regional indicators), rows `[emoji, name, keywords]`, ~120 KB.
* **`tools/build_emoji_data.js`** (new): builds it from emojibase-data 16.0.3 `en/data.json` (MIT) and adds kid keywords ("chinese", "homework", "practice", "chores", "brush teeth").
* **`service-worker.js`**: `./emoji_data.js` in `ASSETS_TO_CACHE`.

### Tests
* **TC140** (new):
  - Tile and hidden select; the stacked dialog fits the viewport; 7 groups / 57 icons, ≥ 44px, current icon pressed, focus on an icon.
  - Pick: closes, updates the row, marks the draft dirty, returns focus.
  - Search: "violin", the "vio" prefix, "red heart" (AND), "chinese" → 🀄 with curated first, pasted 🐉, and "No matches" for 福 / zzqx / shaking (Emoji 15). Clearing restores the groups; Enter picks the first result.
  - Escape, scrim and ✕ close only the picker with no guard; Tab is trapped.
  - Off-list 🦄 kept; a bare ✏ highlights ✏️; save keeps the strings.
  - New draft row and the Unicorn theme; Discard while open.
* **TC139**: asserts the shop button's single `shop-ready-pop`.

---

## 5. Files and Code

### Created Files
* [`emoji_data.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/emoji_data.js): generated icon search data.
* [`tools/build_emoji_data.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tools/build_emoji_data.js): generator.
* [`docs/prd_activity_icon_picker.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_activity_icon_picker.md): spec (v1 §1–§9, v2 §10–§10.7).
* [`docs/checkpoint_94.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_94.md): this file.

### Edited Files
* [`admin.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/admin.js), [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css), [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html), [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js) (`v317`), [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js), [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md).

---

## 6. Validation Instructions

1. Reload to `v317` (Admin › Data › Reload latest version if stale).
2. **Icon picker** (Admin › Activities › ✏️ on an activity → tap the ▾ icon tile):
   - iPad landscape and portrait: the whole dialog is visible (header, search, grid); only the grid scrolls.
   - The current icon is ringed; tap another → the dialog closes, the row shows it, and "● 1 unsaved change" appears; Save.
   - Search "violin", "dog", "chinese", "homework"; paste an emoji from the emoji keyboard; type 福 → "No matches"; clear the search → the groups return.
   - Escape (keyboard), ✕ or tapping the dim area closes only the picker.
3. **Star Vault**: with 5+ stars to spend, open the Vault → the yellow shop button pops once and then stays still.
4. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass.
