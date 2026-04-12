#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// ルートの .env を読み込む（ANTHROPIC_API_KEY 等の設定用）
// Claude Code にログイン済みの場合は不要
{
  const envPath = resolve(process.cwd(), ".env");
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
const listNameArg = args.find((a) => !a.startsWith("-")) ?? "Claude Code";
const cwdArg = args.find((a) => a.startsWith("--cwd="))?.split("=")[1] ?? process.cwd();
const intervalArg = args.find((a) => a.startsWith("--interval="))?.split("=")[1];
const intervalSec = parseInt(intervalArg ?? "10", 10);
const maxTurnsArg = args.find((a) => a.startsWith("--max-turns="))?.split("=")[1];
const maxTurns = parseInt(maxTurnsArg ?? "20", 10);
const apiUrl = args.find((a) => a.startsWith("--api="))?.split("=")[1] ?? "http://localhost:3001";

const api = new TodoFlowApi(apiUrl);

function log(msg: string) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

async function getOrCreateList(name: string) {
  const lists = await api.getLists();
  const found = lists.find((l) => l.name === name);
  if (found) return found;
  log(`リスト "${name}" が見つからないため作成します`);
  return api.createList(name);
}

async function runOnce() {
  const list = await getOrCreateList(listNameArg);
  const tasks = await api.getTasks(list.id);
  // idleのタスクのみ対象（running/done/error/needs_inputは再実行しない）
  const pending = tasks.filter(
    (t) => !t.completed && !t.parentId && t.assignedToRunner && t.runnerStatus === "idle"
  );

  if (pending.length === 0) {
    log(`実行待ちのタスクなし (リスト: "${list.name}")`);
    return;
  }

  log(`${pending.length} 件のタスクを実行します (リスト: "${list.name}")`);

  for (const task of pending) {
    log(`▶ 実行中: ${task.title}`);
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
        log(`✅ 完了: ${task.title}`);
      } else {
        await api.updateStatus(task.id, "needs_input");
        log(`⚠️ 保留: ${task.title}`);
      }
    } catch (err: any) {
      log(`🔴 エラー: ${task.title} — ${err.message}`);
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

async function main() {
  console.log("=== Todo-Flow Runner ===");
  console.log(`  リスト    : ${listNameArg}`);
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
