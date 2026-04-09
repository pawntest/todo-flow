export interface List {
  id: string;
  name: string;
  color: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export type RunnerStatus = 'idle' | 'running' | 'needs_input' | 'error' | 'done';

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  completed: boolean;
  dueDate: Date | null;
  order: number;
  listId: string;
  parentId: string | null;
  subtasks?: Task[];
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  assignedToRunner: boolean;
  runnerStatus: RunnerStatus;
}

export type CreateTaskDTO = {
  title: string;
  listId: string;
  parentId?: string;
  notes?: string;
  dueDate?: Date;
};

export type UpdateTaskDTO = Partial<CreateTaskDTO> & {
  completed?: boolean;
  order?: number;
  assignedToRunner?: boolean;
  runnerStatus?: RunnerStatus;
};

export type CreateListDTO = {
  name: string;
  color?: string;
};

export type UpdateListDTO = Partial<CreateListDTO> & {
  order?: number;
};
