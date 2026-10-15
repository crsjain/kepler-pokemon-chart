#!/bin/bash
# Starts the Firebase Emulators with crash-safe persistence, so nobody has to
# remember to shut them down cleanly.
#
#   - Loads the newest autosave from .emulator_autosave/latest (gitignored),
#     falling back to the committed seed in ./emulator_data. The seed is never
#     written to automatically (this repo is public).
#   - Autosaves every EMULATOR_AUTOSAVE_SECS (default 600) while running. Each
#     save goes to a fresh snap-<timestamp> folder and only then repoints
#     "latest", so an interrupted save can never clobber a good one. The newest
#     EMULATOR_AUTOSAVE_KEEP (default 10) snapshots are kept.
#   - On SIGINT / SIGTERM / SIGHUP (Ctrl+C, sidecar stop, closed terminal) the
#     emulator gets a clean-shutdown signal, so --export-on-exit writes a final
#     save. Worst case after a hard kill or reboot: ~10 minutes lost.
#
# Usage: ./run_emulator.sh            (same as before)
set -u
cd "$(dirname "$0")"

AUTOSAVE_DIR=".emulator_autosave"
SEED_DIR="./emulator_data"
PROJECT="demo-pokemon-chart"
INTERVAL="${EMULATOR_AUTOSAVE_SECS:-600}"
KEEP="${EMULATOR_AUTOSAVE_KEEP:-10}"
PENDING_EXIT="$AUTOSAVE_DIR/pending-exit"

log() { echo "[run_emulator] $*"; }

# Run the firebase binary directly (not through npx) so signals reach it.
FIREBASE_BIN="$(npx --yes --package=firebase-tools -c 'command -v firebase' 2>/dev/null | tail -1)"
if [ -z "$FIREBASE_BIN" ] || [ ! -x "$FIREBASE_BIN" ]; then
  log "Could not locate the firebase CLI via npx."
  exit 1
fi

mkdir -p "$AUTOSAVE_DIR"

is_export() { [ -f "$1/firebase-export-metadata.json" ]; }

prune_snapshots() {
  ls -1d "$AUTOSAVE_DIR"/snap-* 2>/dev/null | sort | head -n -"$KEEP" | xargs -r rm -rf
}

# Moves a finished export into snap-<timestamp> and atomically repoints latest.
promote() {
  local src="$1" name
  name="snap-$(date +%Y%m%d-%H%M%S)"
  mv "$src" "$AUTOSAVE_DIR/$name" || return 1
  ln -sfn "$name" "$AUTOSAVE_DIR/latest.tmp" && mv -T "$AUTOSAVE_DIR/latest.tmp" "$AUTOSAVE_DIR/latest"
  prune_snapshots
  log "Saved $name"
}

autosave_now() {
  local tmp="$AUTOSAVE_DIR/saving.tmp"
  rm -rf "$tmp"
  if "$FIREBASE_BIN" emulators:export "$tmp" --project "$PROJECT" --force >/dev/null 2>&1 && is_export "$tmp"; then
    promote "$tmp"
  else
    rm -rf "$tmp"
    log "Autosave skipped (emulator not ready or export failed)."
  fi
}

# A final export from a previous run that never got promoted (script killed
# after the emulator saved) is still the newest data.
if is_export "$PENDING_EXIT"; then
  promote "$PENDING_EXIT"
fi
rm -rf "$PENDING_EXIT" "$AUTOSAVE_DIR/saving.tmp"

if is_export "$AUTOSAVE_DIR/latest"; then
  # Resolve the symlink: the CLI checks the import path with lstat(), which
  # does not follow links, and silently starts EMPTY if handed "latest".
  IMPORT_DIR="$AUTOSAVE_DIR/$(readlink "$AUTOSAVE_DIR/latest")"
else
  IMPORT_DIR="$SEED_DIR"
fi
log "Importing from $IMPORT_DIR (autosave every ${INTERVAL}s, keeping $KEEP)"

"$FIREBASE_BIN" emulators:start --project "$PROJECT" \
  --import="$IMPORT_DIR" --export-on-exit="$PENDING_EXIT" &
EMU_PID=$!

(
  sleep 60
  while kill -0 "$EMU_PID" 2>/dev/null; do
    sleep "$INTERVAL"
    kill -0 "$EMU_PID" 2>/dev/null || break
    autosave_now
  done
) &
SAVER_PID=$!

STOPPING=0
shutdown() {
  [ "$STOPPING" = 1 ] && return
  STOPPING=1
  log "Stopping the emulator cleanly (saving data)..."
  # The CLI treats SIGINT/SIGTERM/SIGHUP as a clean shutdown and ignores a
  # duplicate within 100ms, so a Ctrl+C that also reached it directly is safe.
  kill -INT "$EMU_PID" 2>/dev/null
}
trap shutdown INT TERM HUP

wait "$EMU_PID"
# `wait` returns early when a trapped signal arrives: give the export up to 60s.
for _ in $(seq 120); do
  kill -0 "$EMU_PID" 2>/dev/null || break
  sleep 0.5
done
if kill -0 "$EMU_PID" 2>/dev/null; then
  log "Emulator did not exit within 60s; terminating (the last autosave is kept)."
  kill -TERM "$EMU_PID" 2>/dev/null
fi

kill "$SAVER_PID" 2>/dev/null
if is_export "$PENDING_EXIT"; then
  promote "$PENDING_EXIT"
fi
