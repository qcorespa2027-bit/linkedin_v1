#!/bin/bash
# stop-scheduler.sh
# Detiene el scheduler de LinkedIn Publisher.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$SCRIPT_DIR/data/scheduler.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "⚠️  No hay scheduler activo (no se encontró PID file)."
  exit 0
fi

PID=$(cat "$PID_FILE")

if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  rm -f "$PID_FILE"
  echo "✅ Scheduler detenido (PID $PID)"
else
  rm -f "$PID_FILE"
  echo "⚠️  El proceso $PID ya no existía. PID file limpiado."
fi
