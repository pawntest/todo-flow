import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TaskService {
  async getTasksForList(listId: string) {
    return prisma.task.findMany({
      where: { listId, parentId: null },
      include: { subtasks: { include: { subtasks: true }, orderBy: { order: 'asc' } } },
      orderBy: { order: 'asc' }
    });
  }

  async getById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: { subtasks: { orderBy: { order: 'asc' } } }
    });
  }

  async create(data: { title: string; listId: string; parentId?: string; notes?: string; dueDate?: Date }) {
    const maxOrder = await prisma.task.aggregate({
      where: { listId: data.listId, parentId: data.parentId || null },
      _max: { order: true }
    });
    return prisma.task.create({ data: { ...data, order: (maxOrder._max.order ?? -1) + 1 } });
  }

  async update(id: string, data: { title?: string; notes?: string; dueDate?: Date | null; completed?: boolean; order?: number }) {
    const updateData: any = { ...data };
    if (data.completed !== undefined) {
      updateData.completedAt = data.completed ? new Date() : null;
    }
    return prisma.task.update({ where: { id }, data: updateData });
  }

  async toggleComplete(id: string, completed: boolean) {
    return prisma.task.update({
      where: { id },
      data: { completed, completedAt: completed ? new Date() : null }
    });
  }

  async delete(id: string) {
    return prisma.task.delete({ where: { id } });
  }
}
