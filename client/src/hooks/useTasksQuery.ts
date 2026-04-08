import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../services/api';

export const useTasksQuery = (listId: string | null) => {
  return useQuery({
    queryKey: ['tasks', listId],
    queryFn: async () => {
      if (!listId) return [];
      const { data } = await tasksApi.getForList(listId);
      return data;
    },
    enabled: !!listId
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => tasksApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.listId] });
    }
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tasksApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });
};

function updateTaskInList(tasks: any[], id: string, updates: Partial<{ completed: boolean; completedAt: string | null }>): any[] {
  return tasks.map(task => {
    if (task.id === id) return { ...task, ...updates };
    if (task.subtasks?.length) return { ...task, subtasks: updateTaskInList(task.subtasks, id, updates) };
    return task;
  });
}

export const useToggleTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; listId: string; completed: boolean }) =>
      tasksApi.toggleComplete(id, completed),
    onMutate: async ({ id, listId, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', listId] });
      const previous = queryClient.getQueryData(['tasks', listId]);
      const completedAt = completed ? new Date().toISOString() : null;
      queryClient.setQueryData(['tasks', listId], (old: any[]) =>
        updateTaskInList(old ?? [], id, { completed, completedAt })
      );
      return { previous, listId };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['tasks', context.listId], context.previous);
      }
    },
    onSettled: (_data, _err, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', listId] });
    }
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });
};
