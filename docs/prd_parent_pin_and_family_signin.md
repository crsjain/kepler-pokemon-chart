# PRD: Parent PIN & Family Sign-in

**Status:** Shipped on `prototype/pokemon-badge-collection` (2026-10-15). Owner: crsjain.
**Supersedes:** the per-child "parent passcode" model described in
[`prd_parent_past_day_approval.md`](prd_parent_past_day_approval.md) §2 and
[`prd_admin_panel_redesign.md`](prd_admin_panel_redesign.md) §11 (Q11 passcode card).

## 1. Problem

The app had two secrets with no in-app explanation:

1. **Family login.** A Firebase Auth email + password that guards Firestore from the internet. It could not be changed or reset in the app.
2. **Parent passcode.** A string (`state.adminPassword`, default `"zxcv"`) that gates Admin, past-day approval and "+ Add Child". It's checked client-side against *whichever child's state is loaded*.

The passcode was meant to be family-wide but was stored per child, and the copies drifted apart:

| # | Drift path | Status |
| :--- | :--- | :--- |
| D1 | New children were seeded from the template (`zxcv`) | **Fixed:** they inherit `getParentPasscode()` |
| D2 | Picker "+ Add Child" on a cold boot checked the module default (`zxcv`) | **Fixed:** every gate checks the family PIN |
| D3 | Per-child "Restore from code" brought back the backup's passcode | **Fixed:** restore keeps the family PIN |
| D4 | Family restore (`setDoc`) brings back the passcode from export time | Accepted: whole-family restore is intentionally total |
| D5 | Stale whole-state writes could revert one child's copy | **Fixed by construction:** child copies are no longer authoritative |

"Sign Out Family" was also ungated. Kids can reach it through Switch Trainer, and signing a tablet out forces the long family password.

## 2. Owner decisions (2026-10-15)

| # | Decision |
| :--- | :--- |
| P1 | **One family-wide Parent PIN of 4–6 digits**, entered on an **on-screen number keypad**. |
| P2 | Family sign-in stays a separate secret, **"once per device"**, with **both** a reset email and an in-app change-password form. |
| P3 | The prod and staging family inboxes are monitored, so the reset email is a valid recovery path. |
| P4 | **Sign Out Family asks for the Parent PIN.** |

## 3. Design

### 3.1 Source of truth

- The family PIN lives at the **doc-level** field `users/{uid}.adminPassword`. `saveAdminPasswordToCloud` already wrote this field; until now it was never read.
- `subscribeToProfiles` passes it as `familyMeta.adminPassword`, and `handleProfilesUpdate` calls `setFamilyPasscode()` (admin.js) before the picker or any prompt can open.
- `getParentPasscode()` precedence: **family field → active child's `state.adminPassword` → `ADMIN_PASSWORD`**. Families that never changed their passcode keep working with no migration.
- Changing the PIN sets the family value optimistically, writes `state.adminPassword`, and **still fans out to every child's copy** for one release so that older cached clients agree. Stop the fan-out in a later cleanup.
- Signing out clears the family PIN in memory.
- **No schema bump.** The field is doc-level, outside `state`, so `LATEST_SCHEMA_VERSION` stays V19.

### 3.2 Prompt modes (`#password-modal`)

| Stored value | Mode | UI |
| :--- | :--- | :--- |
| 4–6 digits | **PIN** (`.pin-mode`) | `#password-keypad` (1–9, Clear, 0, ⌫; 56px keys). The input has `inputmode="none"` so the tablet's soft keyboard never covers the keypad, while a physical keyboard still types. Non-digits are stripped. Entry **auto-submits** at the stored PIN's length. |
| Anything else (`zxcv`, old text passcodes) | **Legacy** | The text field as before, plus `#password-legacy-hint` ("Set a 4–6 digit PIN in Admin › Family…"). Admin › Family shows `#admin-pin-status`. |

A wrong entry shows the inline "That's not the code — try again." line, clears the field and refocuses it. Since 2026-10-15 the line is a **burnt-orange warning** (`#c2410c` on an amber tint `#fff7ed` with a `#ea580c` border; 4.88:1, AA), so a parent can't miss it. It's still never red, with no shake, animation or sound (Q8; Rule 11 warning tone).

Title: "Parent PIN 🔑". Gates and copy:

- Admin entry: "Enter the Parent PIN to open Admin."
- Past-day approval: "…unlock editing for previous days (N-minute window):"
- Picker "+ Add Child": "…add a child."
- Sign Out Family: "…sign this device out."

### 3.3 Admin › Family

- **Parent PIN 🔑** card: New PIN / Confirm (numeric, `maxlength=6`). Validation: empty → "Enter a new PIN."; not 4–6 digits → "Use 4 to 6 digits (numbers only)."; mismatch → inline error. Success shows the "PIN Updated 🔑" toast.
- **Family sign-in ✉️** card (`#admin-signin-card`):
  - Shows the signed-in email.
  - **Send reset email** (secondary): 30 s cooldown, inline confirmation.
  - **Change password** (secondary): reveals Current / New (≥6) / Confirm with **Update password** as the card's only primary. It re-authenticates, then calls `updatePassword`.
  - Copy warns that changing the password **signs out every other device** (Firebase revokes their refresh tokens).
  - Both actions are disabled when the device isn't signed in.
- Firebase errors map to calm copy through `describeAuthError()` (admin.js): `too-many-requests`, `invalid-credential`, `network-request-failed`, `weak-password`, and others.

### 3.4 Family login modal

- Inline styles moved to `style.css` (Rule 8).
- New subtitle: "Sign in once on each device… Daily approvals use the Parent PIN."
- **Forgot password?** is a 44px text link. It emails a reset link to the typed address through `sendPasswordResetEmail`, using Firebase's hosted action page. It's throttled to one send per 30 s. In emulator mode, the link appears in the emulator log.
- Enter in the password field submits. Raw Firebase error strings are replaced with mapped copy.

## 4. Threat model

The PIN is a **speed bump for a 7-year-old**, not security. Firestore rules check only the family UID, so devtools on a signed-in tablet bypasses it. The family sign-in is the real boundary against strangers on the internet. A numeric PIN is easier to shoulder-surf, so masked input and auto-submit keep the entry short. Change the PIN if Kepler learns it.

## 5. Tests

- **TC110:**
  - Family PIN precedence over a drifted child copy.
  - Snapshot meta handling (`null` falls back; no meta leaves the PIN untouched).
  - The picker's "+ Add Child" rejects `zxcv`.
  - The Sign Out gate (Cancel and a wrong PIN never reach the confirm).
  - A new child inherits the PIN.
  - A per-child restore keeps the PIN.
- **TC111:**
  - Keypad layout, size and Rule 8.
  - Append, ⌫ and Clear.
  - Auto-submit on wrong and right entries.
  - Physical-keyboard digit stripping.
  - Legacy mode (no keypad, hint shown, letters allowed).
  - The Family-card nudge.
- **TC112:**
  - Login modal Rule 8, copy and 44px link.
  - Forgot password: empty email, success, throttle, mapped error.
  - Admin card when signed out (disabled) and signed in.
  - Reset email with cooldown.
  - Change-password validation, wrong current password, success toast.
- **Updated:** TC50 and TC100 (numeric PINs, new copy, reset `setFamilyPasscode(null)`); TC97 (title "Parent PIN 🔑"); the TC98 export-hint copy.
- **Seams:** `setFamilyPasscode`, `getParentPasscode`, `setFamilyAuthMock({ email, sendReset, changePassword } | null)`, and `triggerProfilesUpdate(profiles, familyMeta)`.

## 6. Follow-ups

- Stop fanning the PIN out to `profiles.*.state.adminPassword` after one release, and drop `adminPassword` from the state template with a migration.
- Optional: a "This is a parent device" trust toggle (skip the PIN on the parent phone).
- Manual check against real Firebase: reset email delivery (prod and staging) and the sign-out of other devices after a password change.
