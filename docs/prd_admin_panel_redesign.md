# PRD: Parent Admin Panel Redesign (Left Navigation)

**Document**: `docs/prd_admin_panel_redesign.md`  
**Version**: 0.1.0 (SEED — not yet specced)  
**Status**: 🌱 Placeholder — to be built out in a dedicated session  
**Requested By**: crsjain (2026-09-20)  
**Companion Standards**: [`_agents/rules/ux-guidelines.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/rules/ux-guidelines.md) (Rules 4, 5, 8, 12)

---

## 1. Seed Problem Statement

> *"I want to start a PRD to improve the parent admin panel. It likely needs a left nav as the main screen is getting pretty crowded."* — crsjain

The Parent Admin Panel ([`index.html:637`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html#L637), `#admin-modal`) has accumulated controls organically across ~50 checkpoints and is now a single long scrolling column. It currently houses at minimum:

* Task management (add / edit / reorder / soft-delete the 5 daily chores)
* Child profile management (create, delete, per-profile reward customization)
* Passcode management
* Screensaver / idle timeout setting
* Volume and audio settings
* Timezone and week-start-day configuration
* Data operations (local export / import, cloud export / import)
* Diagnostics and force-update
* Claimed rewards history
* Destructive "Wipe All Progress"

**Pending additions that will worsen crowding:**
* `🗝️ Parent Edit Window` duration dropdown — see [`docs/prd_parent_past_day_approval.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_parent_past_day_approval.md)
* Per-profile `🔒 Require Parent Approval for Past Days` toggle

---

## 2. Initial Direction (to be validated by the Review Panel)

A left-nav / tabbed shell inside the existing modal, with candidate sections:

| Section | Contents |
|---|---|
| 👦 **Children** | Profiles, avatars, per-child policies, per-child rewards |
| ✅ **Tasks** | The 5 daily chores, ordering, soft-delete |
| 🎁 **Rewards** | Weekly + Mega milestone reward pools, claimed history |
| ⚙️ **Settings** | Passcode, idle timeout, parent edit window, volume, timezone, week start |
| 💾 **Data** | Export / import (local + cloud), diagnostics, force update |
| ⚠️ **Danger Zone** | Wipe all progress (quarantined from everyday controls) |

---

## 3. Known Constraints to Respect

* **UX Rule 4**: Lock modal to `max-width: 1000px`, `height: 80vh`, `overflow: hidden`; only inner panes scroll.
* **UX Rule 5**: Transparent scrollbar tracks so rounded corners are not flattened.
* **UX Rule 8**: Zero inline `style="..."` attributes. *Note: the current admin markup violates this heavily (e.g. [`app.js:684-694`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js#L684-L694) builds profile rows with inline styles) — the redesign is the natural moment to clean this up.*
* **UX Rule 12**: Pure flex `gap` rhythm; no mixed child margins.
* **Responsive**: Left nav should collapse to horizontal top tabs or an accordion below ~768px.
* **Zero regressions**: All existing admin element IDs are referenced by `tests.js`; any restructure must keep IDs stable or update the affected test cases in lockstep.

---

## 4. Open Questions for the Next Session

1. Left nav inside the existing `#admin-modal`, or promote Admin to a full-screen view?
2. Is "Danger Zone" isolation worth a separate section, or just a visually quarantined block at the bottom of Settings?
3. Should per-child settings live under **Children**, or stay co-located with the global setting they mirror?
4. Do we need search / filter across settings, or is the section count low enough to not warrant it?

---

> [!NOTE]
> This document is intentionally a seed. Run the 5-Perspective Review Panel ([`_agents/skills/feature-review-panel/SKILL.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/skills/feature-review-panel/SKILL.md)) against it once the direction is chosen.
