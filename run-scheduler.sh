#!/bin/bash
# run-scheduler.sh
# Ejecuta el scheduler como proceso en background.
# Uso: ./run-scheduler.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "🔗 LinkedIn Publisher — Iniciar Scheduler"
echo "════════════════════════════════════════════"
echo ""

# Check node
if ! command -v node &>/dev/null; then
  echo "❌ Node.js no encontrado. Instálalo primero."
  exit 1
fi

# Check config
if [ ! -f config.json ]; then
  echo "❌ No hay config.json — Ejecuta primero: npm run token"
  exit 1
fi

# Kill existing scheduler if running
if [ -f data/scheduler.pid ]; then
  OLD_PID=$(cat data/scheduler.pid)
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo "⚠️  Deteniendo scheduler anterior (PID $OLD_PID)..."
    kill "$OLD_PID" 2>/dev/null
    sleep 1
  fi
  rm -f data/scheduler.pid
fi

echo "🚀 Iniciando scheduler en background..."
echo ""

# Run in background, save PID
nohup node src/scheduler.js >> data/scheduler-log.txt 2>&1 &
SCHEDULER_PID=$!
echo "$SCHEDULER_PID" > data/scheduler.pid

echo "✅ Scheduler iniciado!"
echo "   PID: $SCHEDULER_PID"
echo "   Log: data/scheduler-log.txt"
echo ""
echo "📋 Comandos útiles:"
echo "   Ver log:      tail -f data/scheduler-log.txt"
echo "   Detener:      npm run scheduler:stop"
echo "   Estado:       npm run scheduler:status"
echo ""
