import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { tasksApi } from '../services/api';
import { useListsQuery } from './useListsQuery';

export const useTasksQuery = (listId: string | null) => {
  return useQuery({
    queryKey: ['tasks', listId],
    queryFn: async () => {
      if (!listId) return [];
      const { data } = await tasksApi.getForList(listId);
      return data;
    },
    enabled: !!listId,
    // Auto-poll every 3s while any assigned task is active
    refetchInterval: (query) => {
      const data = query.state.data as any[] | undefined;
      const hasActive = data?.some(
        (t: any) => t.assignedToRunner && (t.runnerStatus === 'running' || t.runnerStatus === 'idle')
      );
      return hasActive ? 3000 : false;
    },
  });
};

// Aggregate tasks from ALL lists — used by StatusOverlay in board view
export const useAllTasksFlat = () => {
  const { data: lists } = useListsQuery();
  const queries = useQueries({
    queries: (lists ?? []).map((list: any) => ({
      queryKey: ['tasks', list.id],
      queryFn: async () => {
        const { data } = await tasksApi.getForList(list.id);
        return data;
      },
      enabled: !!list.id,
      refetchInterval: (query: any) => {
        const data = query.state.data as any[] | undefined;
        return data?.some((t: any) => t.runnerStatus === 'running') ? 3000 : false;
      },
    })),
  });
  return queries.flatMap((q) => (q.data ?? []) as any[]);
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
    mutationFn: ({ id, data }: { id: string; data: any; listId?: string }) => tasksApi.update(id, data),
    onMutate: async ({ id, data, listId }) => {
      if (!listId) return;
      await queryClient.cancelQueries({ queryKey: ['tasks', listId] });
      const previous = queryClient.getQueryData(['tasks', listId]);
      queryClient.setQueryData(['tasks', listId], (old: any[]) =>
        updateTaskInList(old ?? [], id, data)
      );
      return { previous, listId };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined && context.listId) {
        queryClient.setQueryData(['tasks', context.listId], context.previous);
      }
    },
    onSettled: (_data, _err, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', listId ?? ''] });
    }
  });
};

function updateTaskInList(tasks: any[], id: string, updates: Record<string, unknown>): any[] {
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
