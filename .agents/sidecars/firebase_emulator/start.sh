#!/bin/bash
cd ../../..
# exec so the sidecar's stop signal reaches run_emulator.sh (clean save on stop).
exec ./run_emulator.sh
