import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listsApi } from '../services/api';

export const useListsQuery = () => {
  return useQuery({
    queryKey: ['lists'],
    queryFn: async () => {
      const { data } = await listsApi.getAll();
      return data;
    }
  });
};

export const useCreateList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color?: string }) => listsApi.create(name, color),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists'] })
  });
};

export const useUpdateList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => listsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists'] })
  });
};

export const useDeleteList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => listsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists'] })
  });
};
