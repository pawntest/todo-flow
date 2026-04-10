import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Task } from "./api.js";

export interface ExecutionResult {
  output: string;
  success: boolean;
}

export async function executeTask(
  task: Task,
  cwd: string,
  maxTurns: number,
  context: { listName?: string } = {}
): Promise<ExecutionResult> {
  const lines: string[] = [];
  let success = true;

  // Build a rich prompt with all available context
  const promptParts: string[] = [];
  if (context.listName) {
    promptParts.push(`# プロジェクト / リスト: ${context.listName}`);
  }
  promptParts.push(`# タスク\n${task.title}`);
  if (task.notes) {
    // Filter out previous runner output headers
    const userNotes = task.notes
      .split('\n')
      .filter(l => !l.startsWith('[todo-flow runner') && !l.startsWith('ステータス:'))
      .join('\n')
      .trim();
    if (userNotes) {
      promptParts.push(`# 補足・詳細\n${userNotes}`);
    }
  }
  promptParts.push(`# 作業ディレクトリ\n${cwd}`);

  const prompt = promptParts.join('\n\n');

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
