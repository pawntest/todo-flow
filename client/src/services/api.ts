import axios from 'axios';

// Use relative path so requests go through Vite's proxy (works on any device on the network)
const API_URL = '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

export const listsApi = {
  getAll: () => api.get('/lists'),
  create: (name: string, color?: string) => api.post('/lists', { name, color }),
  update: (id: string, data: any) => api.patch(`/lists/${id}`, data),
  delete: (id: string) => api.delete(`/lists/${id}`)
};

export const tasksApi = {
  getForList: (listId: string) => api.get(`/tasks/list/${listId}`),
  getById: (id: string) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.patch(`/tasks/${id}`, data),
  toggleComplete: (id: string, completed: boolean) => api.patch(`/tasks/${id}/complete`, { completed }),
  delete: (id: string) => api.delete(`/tasks/${id}`)
};
