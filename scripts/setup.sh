#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

echo "=============================="
echo "  Todo-Flow セットアップ"
echo "=============================="

# ルートの .env がなければ .env.example からコピー
if [ ! -f "$ROOT_DIR/.env" ]; then
  if [ -f "$ROOT_DIR/.env.example" ]; then
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
    echo "✅ .env を作成しました (.env.example からコピー)"
    echo "⚠️  .env の ANTHROPIC_API_KEY を設定してください（runner使用時）"
  fi
else
  echo "ℹ️  .env はすでに存在します"
fi

# server/.env がなければコピー
if [ ! -f "$ROOT_DIR/server/.env" ]; then
  cp "$ROOT_DIR/.env" "$ROOT_DIR/server/.env" 2>/dev/null || \
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/server/.env"
  echo "✅ server/.env を作成しました"
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
