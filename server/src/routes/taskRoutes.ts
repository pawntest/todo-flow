import { Router } from 'express';
import { taskController } from '../controllers/taskController.js';

export const taskRoutes = Router();

taskRoutes.get('/list/:listId', taskController.getTasksForList);
taskRoutes.get('/:id', taskController.getById);
taskRoutes.post('/', taskController.create);
taskRoutes.patch('/:id', taskController.update);
taskRoutes.patch('/:id/complete', taskController.toggleComplete);
taskRoutes.delete('/:id', taskController.delete);
