#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PID_FILE="$ROOT_DIR/.todo-flow.pid"

cd "$ROOT_DIR"

# すでに起動中かチェック
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo "⚠️  すでに起動中です (PID: $OLD_PID)"
    echo "   停止するには: npm run stop"
    exit 1
  else
    rm -f "$PID_FILE"
  fi
fi

echo "=============================="
echo "  Todo-Flow 起動中..."
echo "=============================="

# バックグラウンドで起動し、プロセスグループIDを記録
npm run dev > /tmp/todo-flow.log 2>&1 &
APP_PID=$!

# プロセスグループ全体を追跡できるよう pgid を記録
echo "$APP_PID" > "$PID_FILE"

# 起動確認（最大15秒待つ）
echo "⏳ サーバー起動を待機中..."
for i in $(seq 1 15); do
  sleep 1
  if curl -sf http://localhost:3001/api/lists > /dev/null 2>&1; then
    echo ""
    echo "✅ 起動完了！"
    echo ""
    echo "  フロントエンド: http://localhost:5173"
    echo "  APIサーバー  : http://localhost:3001"
    echo ""
    echo "ログ: tail -f /tmp/todo-flow.log"
    echo "停止: npm run stop"
    echo ""
    exit 0
  fi
  printf "."
done

echo ""
echo "⚠️  起動確認がタイムアウトしました（プロセスは動いているかもしれません）"
echo "   ログ確認: tail -f /tmp/todo-flow.log"
echo "   停止: npm run stop"
