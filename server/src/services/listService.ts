import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ListService {
  async getAll() {
    return prisma.list.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { tasks: true } } }
    });
  }

  async create(name: string, color?: string) {
    const maxOrder = await prisma.list.aggregate({ _max: { order: true } });
    return prisma.list.create({
      data: { name, color, order: (maxOrder._max.order ?? -1) + 1 }
    });
  }

  async update(id: string, data: { name?: string; color?: string; order?: number }) {
    return prisma.list.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.list.delete({ where: { id } });
  }
}
