import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const workList = await prisma.list.create({
    data: { name: 'Work', color: '#3b82f6', order: 0 }
  });

  const personalList = await prisma.list.create({
    data: { name: 'Personal', color: '#10b981', order: 1 }
  });

  await prisma.task.create({
    data: {
      title: 'Complete project proposal',
      listId: workList.id,
      order: 0,
      notes: 'Include budget and timeline sections'
    }
  });

  const parentTask = await prisma.task.create({
    data: {
      title: 'Plan weekend trip',
      listId: personalList.id,
      order: 0,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.task.create({
    data: {
      title: 'Book hotel',
      listId: personalList.id,
      parentId: parentTask.id,
      order: 0
    }
  });

  console.log('✅ Database seeded!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
