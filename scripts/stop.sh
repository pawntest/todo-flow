#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PID_FILE="$ROOT_DIR/.todo-flow.pid"

echo "=============================="
echo "  Todo-Flow 停止中..."
echo "=============================="

STOPPED=0

# PIDファイルから停止
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    # プロセスグループごと終了
    kill -- -"$PID" 2>/dev/null || kill "$PID" 2>/dev/null
    # 子プロセスも念のため終了
    pkill -P "$PID" 2>/dev/null || true
    echo "✅ プロセス停止 (PID: $PID)"
    STOPPED=1
  fi
  rm -f "$PID_FILE"
fi

# ポートを使用しているプロセスも確実に停止
for PORT in 3001 5173; do
  PIDS=$(lsof -ti:"$PORT" 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "$PIDS" | xargs kill 2>/dev/null || true
    echo "✅ ポート $PORT のプロセスを停止"
    STOPPED=1
  fi
done

if [ "$STOPPED" -eq 0 ]; then
  echo "ℹ️  実行中のプロセスはありませんでした"
else
  echo ""
  echo "停止完了"
fi
