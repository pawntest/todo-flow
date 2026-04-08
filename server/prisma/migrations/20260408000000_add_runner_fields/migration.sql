-- AlterTable
ALTER TABLE "Task" ADD COLUMN "assignedToRunner" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Task" ADD COLUMN "runnerStatus" TEXT NOT NULL DEFAULT 'idle';
