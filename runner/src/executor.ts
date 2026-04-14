import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Task, LogEntry } from "./api.js";

export interface ExecutionResult {
  output: string;
  success: boolean;
}

export async function executeTask(
  task: Task,
  cwd: string,
  maxTurns: number,
  context: { listName?: string; previousLog?: LogEntry[] } = {}
): Promise<ExecutionResult> {
  const lines: string[] = [];
  let success = true;

  const promptParts: string[] = [];
  if (context.listName) {
    promptParts.push(`# プロジェクト / リスト: ${context.listName}`);
  }
  promptParts.push(`# タスク\n${task.title}`);

  // User-written notes (excluding runner output)
  if (task.notes) {
    const userNotes = task.notes
      .split("\n")
      .filter(
        (l) =>
          !l.startsWith("[todo-flow runner") && !l.startsWith("ステータス:")
      )
      .join("\n")
      .trim();
    if (userNotes) promptParts.push(`# 補足・詳細\n${userNotes}`);
  }

  // Previous conversation from runnerLog
  const prevMessages = (context.previousLog ?? []).filter(
    (m) => m.role !== "system"
  );
  if (prevMessages.length > 0) {
    const history = prevMessages
      .map(
        (m) =>
          `[${m.role === "assistant" ? "Claude Code" : "ユーザー"}]:\n${m.content}`
      )
      .join("\n\n");
    promptParts.push(`# これまでの会話\n${history}`);
  }

  promptParts.push(`# 作業ディレクトリ\n${cwd}`);

  const prompt = promptParts.join("\n\n");

  try {
    for await (const message of query({
      prompt,
      options: {
        cwd,
        allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        maxTurns,
      },
    })) {
      if ("result" in message) {
        lines.push(message.result);
      }
    }
  } catch (err) {
    success = false;
    lines.push(`エラー: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { output: lines.join("\n").trim(), success };
}
