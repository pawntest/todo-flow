import { Router } from 'express';
import { listController } from '../controllers/listController.js';

export const listRoutes = Router();

listRoutes.get('/', listController.getAll);
listRoutes.post('/', listController.create);
listRoutes.patch('/:id', listController.update);
listRoutes.delete('/:id', listController.delete);
