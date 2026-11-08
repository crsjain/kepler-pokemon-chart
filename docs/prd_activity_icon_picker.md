# PRD: Activity Icon Picker (Admin › Activities)

**Status:** Draft for owner review · **Owner:** crsjain · **Date:** 2026-11-08
**Origin:** Checkpoint 90 §1, "More activity icons → grid emoji picker" (approved 2026-11-07).
**Reserves:** TC140 · **Schema:** none (`task.emoji` stays a plain string)

## 1. Problem

The activity icon is a native `<select class="task-emoji-select">` built from
`TASK_EMOJI_CHOICES` (11 emoji, `admin.js`). That's too few icons, and a long native
list is clumsy on the iPad picker wheel. The quick fix (a longer `<select>` with
`<optgroup>`s) was skipped in favour of a grid popover.

## 2. Solution summary

In an open (✏️) Activities row, the icon becomes a **tappable tile button**. Tapping
it opens a **popover grid** of about 56 curated emoji in 7 groups, plus an
**Any emoji** field for anything else on the iPad keyboard.

The `<select>` **stays in the DOM, hidden**, as the row's value store, so the draft
model (`readActivityRows`, dirty count, Save bar, unsaved guard) and existing tests
that set `.task-emoji-select` keep working. Picking an icon writes the select's value,
adding an `<option>` if needed, and dispatches a bubbling `change` event. That's the
same path the select uses today.

## 3. Layout

### 3.1 Tile button (edit mode only)

- `button.adm-emoji-tile-btn` sits where the select was: 44×44 tile, `--adm-secondary-fill`,
  radius 8, emoji 24px, a small ▾ caret badge in the bottom-right corner so it reads as
  "tap to change".
- `aria-haspopup="dialog"`, `aria-expanded`, `aria-label="Activity icon 🎹, change icon"`.
- Read mode is unchanged: the 40px `.adm-task-emoji` summary tile, which isn't tappable
  (only ✏️ enters edit mode, PRD §11.7).

### 3.2 Popover

- `div.adm-emoji-popover[role=dialog][aria-label="Choose an icon"]`, appended inside the
  row (`.admin-task-item` gets `position: relative`), anchored 8px below the tile.
- White card, 2px `--adm-line` border, radius 12, soft shadow, padding 12, gap 12.
  No pixel frame, so it reads as a surface, not a button.
- **Header:** "Choose an icon" (bold, `--adm-ink`) + ✕ close (`.pixel-btn.adm-icon-btn.adm-tertiary`, 44px).
- **Body** (scrolls; header and footer stay fixed):
  - Optional **"This activity"** group, shown only when the current emoji isn't in the
    curated list (off-list emoji are preserved, §5).
  - 7 groups. Each has a small heading (0.75rem, 800 weight, `--adm-ink-2`, letter-spaced)
    over a grid of **48×48 buttons** (emoji 28px), `gap: 4px`.
  - **Current icon:** `--adm-secondary-fill` with a 2px `--adm-primary` ring, `aria-pressed="true"`.
  - Hover/focus: `--adm-secondary-fill`; focus ring `2px solid --adm-focus` (`:focus-visible`).
- **Footer:** a hairline divider, then a visible label "Any emoji", a flat field
  (`.pixel-input`, 44px, placeholder "e.g. 🦄") and a **Use** button
  (`.pixel-btn.adm-secondary`). The inline message line below uses the warning tone
  already used for the wrong-PIN line (`#c2410c` on `#fff7ed`, never red), `aria-live="polite"`.

### 3.3 Sizes by form factor

| Viewport | Popover | Body max-height | Columns of 48px buttons |
| :--- | :--- | :--- | :--- |
| Tablet / desktop (> 520px) | 368px wide, left edge aligned to the tile | 320px | 6 |
| Phone (≤ 520px) | Full row width (left/right 0) | 50vh | 6 on 390px |

The popover scrolls into view (`block: 'nearest'`) when it opens near the bottom of the pane.

## 4. Curated list (56)

| Group | Emoji |
| :--- | :--- |
| School | 📚 ✏️ 📝 🧮 🔢 🔤 🧪 🔬 🌍 💻 |
| Languages | 💮 🀄 🗣️ 🔠 |
| Music & Art | 🎹 🎻 🎸 🥁 🎺 🎤 🎨 ✂️ 🧶 🩰 |
| Sports | 🏃 ⚽ 🏀 🏊 🚴 🤸 🥋 🎾 🧘 ⛸️ |
| Chores | 🧹 🛏️ 🧺 🍽️ 🧸 🪴 🐶 🗑️ 🧼 👕 |
| Healthy habits | 🪥 🥦 🍎 💧 🛁 😴 |
| Kindness | 💖 🤝 🙏 😊 🎁 ✉️ |

All 11 current choices are included, so every existing activity is highlighted in its group.

**Old-iPad check** (the newest emoji in the list):

| Emoji | Unicode emoji version | Needs iOS / iPadOS |
| :--- | :--- | :--- |
| 🪥 toothbrush | 14.0 | **15.4+** (Mar 2022) |
| 🪴 potted plant | 13.0 | 14.2+ |
| 🩰 ballet shoes | 12.0 | 13.2+ |
| 🧮 🧶 🧺 🧼 🧸 | 11.0 | 12.1+ |

Everything else is Emoji 10 (iOS 11.1) or older. **Open question Q1:** keep 🪥, or swap it
for 🦷 (tooth, Emoji 10) if a kids' tablet is on iPadOS < 15.4?

## 5. Interactions

| Action | Result |
| :--- | :--- |
| Tap tile | Opens the popover. Focus goes to the current icon's button (else the first). `aria-expanded="true"`. |
| Tap an emoji | Sets the value, closes, updates the tile and summary, focuses the tile. |
| Tap the current emoji | Closes with no change (the draft stays clean, since dirty means "differs from state"). |
| Any emoji + Use / Enter | Valid → same as tapping an emoji. Invalid → inline message, field keeps its text, popover stays open. |
| Escape | Closes the popover only (it handles Escape first and stops propagation), focuses the tile. Admin stays open. |
| Tap outside | Closes the popover only. That tap is swallowed: it doesn't close Admin via the backdrop and doesn't press whatever was under it (e.g. 🗑). |
| ✕ | Closes, focuses the tile. |
| Tap tile again | Toggles closed. |

**Value changes** go through one helper, `setRowEmoji(item, emoji)`: it adds an `<option>`
when the select doesn't have one, sets `select.value`, then dispatches
`new Event('change', { bubbles: true })`. That runs `syncTaskSummary` and the Activities
dirty refresh exactly as the select's change does today: "● N unsaved changes",
Save Activities, and the unsaved guard on close.

### 5.1 "Any emoji" validation

`parseSingleEmoji(text)` → emoji string or `null`:

1. Trim whitespace. Empty → "Type or paste an emoji first."
2. Split into graphemes with `Intl.Segmenter('en', { granularity: 'grapheme' })`. If
   `Intl.Segmenter` isn't available, fall back to the regex in step 3 matching the whole string.
3. Accept only exactly **one** grapheme that is an emoji:
   `\p{Extended_Pictographic}`, a flag (two `\p{Regional_Indicator}`), or a keycap (`[#*0-9]\uFE0F?\u20E3`).
   This covers ZWJ families, skin tones and flags.
4. Otherwise: "Just one emoji, please — like 🦄." (for "ab", "🎹🎹", "1", "Piano" and similar).

No `alert()` / `confirm()` (UX §6.2).

## 6. Edge cases

- **Off-list emoji (e.g. 🦄 from an old save or the Any emoji field)** shows in the
  "This activity" group at the top, highlighted. The hidden select keeps it as an option,
  so it never resets. Choosing another icon and coming back still offers it until the row is re-rendered.
- **New (draft) rows** default to 📝 as today; the picker works the same before Save.
- **One popover at a time.** Opening another row's picker, or ✏️ on another row, closes
  the first. Closing the row (✓ Done), deleting it, switching tabs, Save, Discard or closing
  Admin all close the popover.
- **Layering:** it sits inside `.modal-content`, so it can never be the backdrop target. The
  outside-tap swallow also covers a tap on the dimmed backdrop.
- **Themes:** Admin uses the `--adm-*` tokens in both themes (the Unicorn skin doesn't
  restyle Admin), so it looks the same in each. TC140 checks both.
- **Keyboard:** Tab is trapped in Admin as today; the popover's controls are in DOM order
  (✕ → emoji → field → Use).

## 7. Implementation notes

- `admin.js`: `TASK_EMOJI_GROUPS` (ordered array of `{ label, emoji[] }`);
  `TASK_EMOJI_CHOICES` becomes the flattened list (still used for the off-list check).
  Add `openEmojiPicker(item)`, `closeEmojiPicker({ focusTile })`, `setRowEmoji`,
  `parseSingleEmoji`, plus one document-level capture `pointerdown` / `click` / `keydown`
  trio that is a no-op while no picker is open. Export `parseSingleEmoji` only if a test needs it.
- `style.css` (`@section admin`, Activities block): `.adm-emoji-tile-btn`,
  `.adm-emoji-popover` and its parts, plus the ≤ 520px rule. The select gets
  `display: none` in both modes. No inline styles (UX §8).
- Buttons inside `#admin-modal` that use `.pixel-btn` carry an `adm-*` class (TC97). The
  emoji cells are plain `button.adm-emoji-cell` (not `.pixel-btn`), so TC97 ignores them.
- Cache: bump `CACHE_NAME`, `style.css?v=`, `app.js?v=` and all importmap entries (TC90).

## 8. Test plan

**TC140 — Activity icon picker** (new):

1. Open Admin › Activities, ✏️ the first activity. The tile button is visible and the select is hidden.
2. Tap the tile → popover open, 7 group headings, ≥ 50 cells, each cell ≥ 44×44, the current icon has `aria-pressed="true"`.
3. Pick ⚽ from Sports → popover closed, tile and summary show ⚽, `.task-emoji-select` value is ⚽, the Save bar shows unsaved changes.
4. Reopen, type 🦄 in Any emoji + Use → value 🦄; reopen → a "This activity" group shows 🦄 highlighted.
5. Invalid input: "ab", "🎹🎹", "" → inline message visible, popover still open, value unchanged.
6. Escape → popover closed, Admin still open. Reopen, outside `pointerdown` + `click` on the Admin backdrop → popover closed, Admin still open.
7. An activity saved with an off-list emoji (🦄) renders it in the summary and "This activity" group, and Save Activities keeps it.
8. New draft row (Add activity): the picker sets its icon before save.
9. Repeat step 2 with `state.theme = 'unicorn'`.
10. Discard restores the original icons; no native dialogs.

**Regression:** TC1/TC58 (sets `.task-emoji-select` ~L280), the test at ~L8685 (`value = '🧹'`), TC97 (adm-* classes), TC104 (summary rows), TC90 (cache). Full suite 100% green.

## 9. Open questions

- **Q1:** 🪥 needs iPadOS 15.4+. Keep it, or use 🦷?
- **Q2:** On phones, full-row-width popover inside the row (as mocked), or a bottom sheet? The mock uses the in-row version: simpler, and no fixed positioning inside the animated modal.
