#!/usr/bin/env bash
# Start TuVi AI locally (production build) on 127.0.0.1 only — never exposed to the network.
# Usage: ./scripts/start.sh [--rebuild]      PORT=3000 by default; the next free port is used if busy.
set -euo pipefail
cd "$(dirname "$0")/.."
PIDFILE=.tuvi-server.pid; PORTFILE=.tuvi-server.port; LOG=tuvi-server.log
if [[ -f $PIDFILE ]] && kill -0 "$(cat $PIDFILE)" 2>/dev/null; then
  echo "TuVi AI đang chạy (pid $(cat $PIDFILE)) tại http://localhost:$(cat $PORTFILE)"; exit 0
fi
[[ -d node_modules ]] || npm ci
if [[ ! -f .next/BUILD_ID || "${1:-}" == "--rebuild" ]]; then echo "Đang build…"; npm run build >/dev/null; fi
PORT=${PORT:-3000}
for _ in $(seq 0 10); do
  lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1 || break
  echo "Cổng $PORT đang bận, thử $((PORT + 1))"; PORT=$((PORT + 1))
done
nohup npx next start -H 127.0.0.1 -p "$PORT" >"$LOG" 2>&1 &
echo $! >"$PIDFILE"; echo "$PORT" >"$PORTFILE"
for _ in $(seq 1 60); do
  if curl -fs "http://127.0.0.1:$PORT/api/health" >/dev/null; then
    echo "TuVi AI sẵn sàng: http://localhost:$PORT  (log: $LOG)"
    curl -s "http://127.0.0.1:$PORT/api/health" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const h=JSON.parse(s);console.log('  engine:',h.engine.ok?'ok':'LỖI','· Ollama:',h.ai.ollama.reachable?h.ai.ollama.selected:'chưa sẵn sàng ('+h.ai.ollama.error+')','· dữ liệu:',h.dataset.yearsAvailable+'/'+h.dataset.yearsTotal,'năm')})"
    exit 0
  fi
  sleep 1
done
echo "Không khởi động được — xem $LOG"; exit 1
