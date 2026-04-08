import { useState, useMemo } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useTasksQuery, useCreateTask } from '../../hooks/useTasksQuery';
import { useListsQuery } from '../../hooks/useListsQuery';
import { TaskItem } from './TaskItem';
import { EmptyState } from '../ui/EmptyState';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';

export const TaskList = () => {
  const { selectedListId, setMobileView, runnerStatusFilter } = useUIStore();
  const { data: tasks, isLoading } = useTasksQuery(selectedListId);
  const { data: lists } = useListsQuery();
  const createTask = useCreateTask();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    if (!runnerStatusFilter) return tasks;
    return tasks.filter((t: any) => {
      if (!t.assignedToRunner) return false;
      if (runnerStatusFilter === 'pending') return t.runnerStatus === 'idle' || t.runnerStatus === 'running';
      if (runnerStatusFilter === 'needs_input') return t.runnerStatus === 'needs_input';
      if (runnerStatusFilter === 'done') return t.runnerStatus === 'done';
      return false;
    });
  }, [tasks, runnerStatusFilter]);

  const currentList = lists?.find((l: any) => l.id === selectedListId);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedListId) return;
    await createTask.mutateAsync({ title: newTaskTitle, listId: selectedListId });
    setNewTaskTitle('');
  };

  if (!selectedListId) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white">
        <div className="p-4 border-b flex items-center gap-3">
          <button
            onClick={() => setMobileView('sidebar')}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            ☰
          </button>
          <h2 className="font-semibold text-gray-800">Tasks</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState icon="📋" title="Select a list" description="Choose a list to see your tasks" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3">
        <button
          onClick={() => setMobileView('sidebar')}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 text-lg"
          aria-label="Back to lists"
        >
          ←
        </button>
        <div className="flex items-center gap-2 flex-1">
          {currentList?.color && (
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: currentList.color }} />
          )}
          <h2 className="font-semibold text-gray-800 text-lg">{currentList?.name || 'Tasks'}</h2>
        </div>
      </div>

      {/* Add Task */}
      <div className="px-4 py-3 border-b bg-gray-50">
        <form onSubmit={handleCreateTask} className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a task..."
            className="flex-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-base"
          />
          <button
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-40 transition-opacity"
          >
            Add
          </button>
        </form>
      </div>

      {/* Task Items */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {isLoading ? (
          <LoadingSkeleton />
        ) : filteredTasks.length > 0 ? (
          <div className="space-y-1">
            {filteredTasks.map((task: any) => (
              <TaskItem key={task.id} task={task} depth={0} />
            ))}
          </div>
        ) : (
          <EmptyState icon="✨" title="No tasks yet" description="Add your first task above" />
        )}
      </div>
    </div>
  );
};
