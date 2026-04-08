#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

echo "=============================="
echo "  Todo-Flow セットアップ"
echo "=============================="

# .env がなければ .env.example からコピー
if [ ! -f "$ROOT_DIR/server/.env" ]; then
  if [ -f "$ROOT_DIR/.env.example" ]; then
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/server/.env"
    echo "✅ server/.env を作成しました (.env.example からコピー)"
  fi
else
  echo "ℹ️  server/.env はすでに存在します"
fi

# npm install（全ワークスペース）
echo ""
echo "📦 依存パッケージをインストール中..."
npm install

# DBマイグレーション
echo ""
echo "🗄️  データベースをセットアップ中..."
npm run db:migrate -- --name init 2>/dev/null || npm run db:migrate 2>/dev/null || true

echo ""
echo "✅ セットアップ完了！"
echo ""
echo "次のコマンドでアプリを起動できます:"
echo "  npm run start"
echo ""
