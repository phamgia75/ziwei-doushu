#!/usr/bin/env bash
# Stop the local TuVi AI server started by scripts/start.sh.
set -euo pipefail
cd "$(dirname "$0")/.."
PIDFILE=.tuvi-server.pid
if [[ ! -f $PIDFILE ]]; then echo "TuVi AI không chạy."; exit 0; fi
PID=$(cat $PIDFILE)
if kill -0 "$PID" 2>/dev/null; then
  pkill -TERM -P "$PID" 2>/dev/null || true; kill -TERM "$PID" 2>/dev/null || true
  for _ in $(seq 1 10); do kill -0 "$PID" 2>/dev/null || break; sleep 0.5; done
fi
rm -f $PIDFILE .tuvi-server.port
echo "Đã dừng TuVi AI."
