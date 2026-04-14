import axios from "axios";

export interface LogEntry {
  role: "system" | "assistant" | "user";
  content: string;
  ts: string;
}

export interface List {
  id: string;
  name: string;
  color: string | null;
  order: number;
}

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  completed: boolean;
  dueDate: string | null;
  order: number;
  listId: string;
  parentId: string | null;
  subtasks?: Task[];
  assignedToRunner: boolean;
  runnerStatus: string;
  runnerLog: string; // JSON-encoded LogEntry[]
}

export class TodoFlowApi {
  private client;

  constructor(baseUrl: string) {
    this.client = axios.create({ baseURL: baseUrl });
  }

  async getLists(): Promise<List[]> {
    const res = await this.client.get<List[]>("/api/lists");
    return res.data;
  }

  async createList(name: string): Promise<List> {
    const res = await this.client.post<List>("/api/lists", { name });
    return res.data;
  }

  async getTasks(listId: string): Promise<Task[]> {
    const res = await this.client.get<Task[]>(`/api/tasks/list/${listId}`);
    return res.data;
  }

  async getTask(taskId: string): Promise<Task> {
    const res = await this.client.get<Task>(`/api/tasks/${taskId}`);
    return res.data;
  }

  async markComplete(taskId: string): Promise<void> {
    await this.client.patch(`/api/tasks/${taskId}/complete`, { completed: true });
  }

  async updateRunnerLog(taskId: string, log: LogEntry[]): Promise<void> {
    await this.client.patch(`/api/tasks/${taskId}`, { runnerLog: JSON.stringify(log) });
  }

  async updateStatus(taskId: string, runnerStatus: string): Promise<void> {
    await this.client.patch(`/api/tasks/${taskId}`, { runnerStatus });
  }

  async updateStatusAndLog(taskId: string, runnerStatus: string, log: LogEntry[]): Promise<void> {
    await this.client.patch(`/api/tasks/${taskId}`, {
      runnerStatus,
      runnerLog: JSON.stringify(log),
    });
  }
}
