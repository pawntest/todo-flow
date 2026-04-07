#!/usr/bin/env node
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
  const pending = tasks.filter((t) => !t.completed && !t.parentId);

  if (pending.length === 0) {
    log(`実行待ちのタスクなし (リスト: "${list.name}")`);
    return;
  }

  log(`${pending.length} 件のタスクを実行します (リスト: "${list.name}")`);

  for (const task of pending) {
    log(`▶ 実行中: ${task.title}`);
    const result = await executeTask(task, cwdArg, maxTurns);

    const status = result.success ? "✅ 完了" : "❌ エラー";
    const notes = [
      `[todo-flow runner ${new Date().toISOString()}]`,
      `ステータス: ${status}`,
      "",
      result.output || "(出力なし)",
    ].join("\n");

    await api.updateNotes(task.id, notes);
    await api.markComplete(task.id);
    log(`${status}: ${task.title}`);
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
