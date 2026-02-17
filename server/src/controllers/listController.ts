import { Request, Response } from 'express';
import { ListService } from '../services/listService.js';

const listService = new ListService();

export const listController = {
  async getAll(req: Request, res: Response) {
    try {
      const lists = await listService.getAll();
      res.json(lists);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch lists' });
    }
  },
  async create(req: Request, res: Response) {
    try {
      const { name, color } = req.body;
      const list = await listService.create(name, color);
      res.status(201).json(list);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create list' });
    }
  },
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const list = await listService.update(id, req.body);
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update list' });
    }
  },
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await listService.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete list' });
    }
  }
};
