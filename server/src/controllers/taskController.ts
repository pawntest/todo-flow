import { Request, Response } from 'express';
import { TaskService } from '../services/taskService.js';

const taskService = new TaskService();

export const taskController = {
  async getTasksForList(req: Request, res: Response) {
    try {
      const { listId } = req.params;
      const tasks = await taskService.getTasksForList(listId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  },
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const task = await taskService.getById(id);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  },
  async create(req: Request, res: Response) {
    try {
      const task = await taskService.create(req.body);
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create task' });
    }
  },
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const task = await taskService.update(id, req.body);
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update task' });
    }
  },
  async toggleComplete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { completed } = req.body as { completed: boolean };
      const task = await taskService.toggleComplete(id, completed);
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: 'Failed to toggle task' });
    }
  },
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await taskService.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
};
