#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// runner/src/index.ts の場所からプロジェクトルートを特定
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "../../"); // runner/src -> runner -> project root

// .env をプロジェクトルートから読み込む（ANTHROPIC_API_KEY 等の設定用）
// Claude Code にログイン済みの場合は不要
{
  const envPath = resolve(PROJECT_ROOT, ".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf-8").split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      const key = m[1];
      const val = m[2].trim().replace(/^(['"])(.*)\1$/, "$2");
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

import { TodoFlowApi } from "./api.js";
import { executeTask } from "./executor.js";

// --- CLI引数パース ---
const args = process.argv.slice(2);
const watchMode = args.includes("--watch") || args.includes("-w");
// デフォルトCWDはプロジェクトルート（runner/ではなく）
const cwdArg = args.find((a) => a.startsWith("--cwd="))?.split("=")[1] ?? PROJECT_ROOT;
const intervalArg = args.find((a) => a.startsWith("--interval="))?.split("=")[1];
const intervalSec = parseInt(intervalArg ?? "10", 10);
const maxTurnsArg = args.find((a) => a.startsWith("--max-turns="))?.split("=")[1];
const maxTurns = parseInt(maxTurnsArg ?? "20", 10);
const apiUrl = args.find((a) => a.startsWith("--api="))?.split("=")[1] ?? "http://localhost:3001";

const api = new TodoFlowApi(apiUrl);

function log(msg: string) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

async function runOnce() {
  // 全リストを取得して assignedToRunner=true かつ idle のタスクを処理
  const lists = await api.getLists();

  let totalPending = 0;
  for (const list of lists) {
    const tasks = await api.getTasks(list.id);
    const pending = tasks.filter(
      (t) => !t.completed && !t.parentId && t.assignedToRunner && t.runnerStatus === "idle"
    );
    totalPending += pending.length;

    for (const task of pending) {
      log(`▶ [${list.name}] ${task.title}`);
      try {
        await api.updateStatus(task.id, "running");

        const result = await executeTask(task, cwdArg, maxTurns, { listName: list.name });

        const status = result.success ? "✅ 完了" : "❌ 保留";
        const notes = [
          `[todo-flow runner ${new Date().toISOString()}]`,
          `ステータス: ${status}`,
          "",
          result.output || "(出力なし)",
        ].join("\n");

        await api.updateNotes(task.id, notes);
        if (result.success) {
          await api.updateStatus(task.id, "done");
          await api.markComplete(task.id);
          log(`✅ [${list.name}] ${task.title}`);
        } else {
          await api.updateStatus(task.id, "needs_input");
          log(`⚠️ [${list.name}] ${task.title}`);
        }
      } catch (err: any) {
        log(`🔴 [${list.name}] ${task.title} — ${err.message}`);
        await api.updateStatus(task.id, "error").catch(() => {});
        await api.updateNotes(task.id, [
          `[todo-flow runner ${new Date().toISOString()}]`,
          `ステータス: ❌ エラー`,
          "",
          err.message || "(不明なエラー)",
        ].join("\n")).catch(() => {});
      }
    }
  }

  if (totalPending === 0) {
    log("実行待ちのタスクなし（全リスト）");
  }
}

async function main() {
  console.log("=== Todo-Flow Runner ===");
  console.log(`  作業ディレクトリ: ${cwdArg}`);
  console.log(`  APIサーバー: ${apiUrl}`);
  console.log(`  最大ターン数: ${maxTurns}`);
  if (watchMode) {
    console.log(`  ウォッチモード: ${intervalSec}秒おき`);
  }
  console.log("");

  if (watchMode) {
    await runOnce();
    setInterval(() => {
      runOnce().catch((err) => {
        console.error("エラー:", err.message);
      });
    }, intervalSec * 1000);
  } else {
    await runOnce();
  }
}

main().catch((err) => {
  console.error("致命的エラー:", err.message);
  process.exit(1);
});
