#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// runner/src/index.ts の場所からプロジェクトルートを特定
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "../../");

// .env をプロジェクトルートから読み込む
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

import { TodoFlowApi, type LogEntry } from "./api.js";
import { executeTask } from "./executor.js";

const args = process.argv.slice(2);
const watchMode = args.includes("--watch") || args.includes("-w");
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

function now(): string {
  return new Date().toISOString();
}

function parseLog(raw: string | undefined): LogEntry[] {
  try {
    return JSON.parse(raw ?? "[]");
  } catch {
    return [];
  }
}

async function runOnce() {
  const lists = await api.getLists();
  let totalPending = 0;

  for (const list of lists) {
    const tasks = await api.getTasks(list.id);
    const pending = tasks.filter(
      (t) =>
        !t.completed &&
        !t.parentId &&
        t.assignedToRunner &&
        t.runnerStatus === "idle"
    );
    totalPending += pending.length;

    for (const task of pending) {
      log(`▶ [${list.name}] ${task.title}`);

      // Fetch latest task (to get up-to-date runnerLog with user replies)
      const latestTask = await api.getTask(task.id);
      const currentLog = parseLog(latestTask.runnerLog);

      // Append "started" system message
      const startedLog: LogEntry[] = [
        ...currentLog,
        { role: "system", content: "タスクを開始しました", ts: now() },
      ];

      await api.updateStatusAndLog(task.id, "running", startedLog);

      try {
        const result = await executeTask(latestTask, cwdArg, maxTurns, {
          listName: list.name,
          previousLog: currentLog,
        });

        const statusMsg = result.success ? "✅ 完了" : "⚠️ 保留（要確認）";
        const completedLog: LogEntry[] = [
          ...startedLog,
          {
            role: "assistant",
            content: result.output || "(出力なし)",
            ts: now(),
          },
          { role: "system", content: statusMsg, ts: now() },
        ];

        if (result.success) {
          await api.updateStatusAndLog(task.id, "done", completedLog);
          await api.markComplete(task.id);
          log(`✅ [${list.name}] ${task.title}`);
        } else {
          await api.updateStatusAndLog(task.id, "needs_input", completedLog);
          log(`⚠️ [${list.name}] ${task.title}`);
        }
      } catch (err: any) {
        log(`🔴 [${list.name}] ${task.title} — ${err.message}`);
        const errorLog: LogEntry[] = [
          ...startedLog,
          {
            role: "system",
            content: `❌ エラー: ${err.message || "不明なエラー"}`,
            ts: now(),
          },
        ];
        await api.updateStatusAndLog(task.id, "error", errorLog).catch(() => {});
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
  if (watchMode) console.log(`  ウォッチモード: ${intervalSec}秒おき`);
  console.log("");

  if (watchMode) {
    await runOnce();
    setInterval(() => {
      runOnce().catch((err) => console.error("エラー:", err.message));
    }, intervalSec * 1000);
  } else {
    await runOnce();
  }
}

main().catch((err) => {
  console.error("致命的エラー:", err.message);
  process.exit(1);
});
