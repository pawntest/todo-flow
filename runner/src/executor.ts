import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Task } from "./api.js";

export interface ExecutionResult {
  output: string;
  success: boolean;
}

export async function executeTask(
  task: Task,
  cwd: string,
  maxTurns: number
): Promise<ExecutionResult> {
  const lines: string[] = [];
  let success = true;

  try {
    for await (const message of query({
      prompt: task.title,
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
