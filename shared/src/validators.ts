import { z } from 'zod';

// List validators
export const createListSchema = z.object({
  name: z.string().min(1, 'List name is required').max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const updateListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const reorderListsSchema = z.object({
  listIds: z.array(z.string().uuid()),
});

// Task validators
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(500),
  listId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  notes: z.string().max(5000).optional(),
  dueDate: z.string().datetime().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  notes: z.string().max(5000).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  completed: z.boolean().optional(),
});

export const reorderTasksSchema = z.object({
  taskIds: z.array(z.string().uuid()),
});

// Export types inferred from schemas
export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type ReorderListsInput = z.infer<typeof reorderListsSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
