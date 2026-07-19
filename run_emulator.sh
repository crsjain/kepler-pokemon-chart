#!/bin/bash
# Starts the Firebase Emulators with state persistence.
# It automatically imports state from ./emulator_data and exports it back on exit.
npx --package=firebase-tools firebase emulators:start --import=./emulator_data --export-on-exit
