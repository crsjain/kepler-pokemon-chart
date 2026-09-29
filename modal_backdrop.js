/**
 * Shared "click outside to close" policy for every `.modal` overlay.
 *
 * Policy (owner-approved 2026-09-29):
 *  - Read-only / clean modals close on a backdrop click.
 *  - Modals holding unsaved edits never discard silently: their onDismiss shows
 *    an "unsaved changes" guard whose default (and backdrop) is Keep editing.
 *  - Confirms treat the backdrop as No / Cancel.
 *  - Kid celebrations (Level Up, Eevee) and the Family Login gate have no
 *    backdrop dismiss at all.
 *
 * A click only counts as a backdrop click if the pointer also went DOWN on the
 * backdrop. Without this, selecting text in an input and releasing the mouse
 * outside the card dispatches `click` on the common ancestor (the overlay) and
 * would close the modal mid-edit. Programmatic `.click()` / dispatched clicks
 * (tests, keyboard) have no preceding pointerdown and are accepted.
 */

let pointerDownTarget = null;

if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', (e) => { pointerDownTarget = e.target; }, true);
  // Reset after every click has finished dispatching, so a stale target never
  // leaks into a later programmatic click.
  window.addEventListener('click', () => { pointerDownTarget = null; });
}

/** True when `e` is a genuine click on `modal`'s own backdrop. */
export function isBackdropClick(e, modal) {
  if (!modal || e.target !== modal) return false;
  return pointerDownTarget === null || pointerDownTarget === modal;
}

/** Wires `onDismiss` to genuine backdrop clicks on `modal`. Idempotent per modal. */
export function bindBackdropDismiss(modal, onDismiss) {
  if (!modal || modal.dataset.backdropBound === 'true') return;
  modal.dataset.backdropBound = 'true';
  modal.addEventListener('click', (e) => {
    if (isBackdropClick(e, modal)) onDismiss(e);
  });
}
