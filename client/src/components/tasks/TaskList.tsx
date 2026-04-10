import { useState, useMemo } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useTasksQuery, useCreateTask, useUpdateTask } from '../../hooks/useTasksQuery';
import { useListsQuery } from '../../hooks/useListsQuery';
import { TaskItem } from './TaskItem';
import { EmptyState } from '../ui/EmptyState';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';

interface TaskListProps {
  listId: string;
}

export const TaskList = ({ listId }: TaskListProps) => {
  const { runnerStatusFilter, setMobileView } = useUIStore();
  const { data: tasks, isLoading } = useTasksQuery(listId);
  const { data: lists } = useListsQuery();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [assignOnCreate, setAssignOnCreate] = useState(false);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    if (!runnerStatusFilter) return tasks;
    return tasks.filter((t: any) => {
      if (!t.assignedToRunner) return false;
      if (runnerStatusFilter === 'pending') return t.runnerStatus === 'idle' || t.runnerStatus === 'running';
      if (runnerStatusFilter === 'needs_input') return t.runnerStatus === 'needs_input';
      if (runnerStatusFilter === 'error') return t.runnerStatus === 'error';
      if (runnerStatusFilter === 'done') return t.runnerStatus === 'done';
      return false;
    });
  }, [tasks, runnerStatusFilter]);

  const currentList = lists?.find((l: any) => l.id === listId);

  // Column stats for header badges
  const stats = useMemo(() => ({
    running: (tasks ?? []).filter((t: any) => t.assignedToRunner && t.runnerStatus === 'running').length,
    error: (tasks ?? []).filter((t: any) => t.assignedToRunner && (t.runnerStatus === 'error' || t.runnerStatus === 'needs_input')).length,
    total: (tasks ?? []).length,
  }), [tasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const res = await createTask.mutateAsync({ title: newTaskTitle, listId });
    if (assignOnCreate && res?.data?.id) {
      updateTask.mutate({ id: res.data.id, listId, data: { assignedToRunner: true } });
    }
    setNewTaskTitle('');
  };

  return (
    <div className="md:w-72 md:flex-shrink-0 md:rounded-xl md:shadow-sm md:border md:border-gray-200 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <button
          onClick={() => setMobileView('sidebar')}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 text-lg flex-shrink-0"
          aria-label="Back to lists"
        >
          ←
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {currentList?.color && (
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: currentList.color }} />
          )}
          <h2 className="font-semibold text-gray-800 text-sm truncate">{currentList?.name || 'Tasks'}</h2>
          <span className="text-xs text-gray-400 flex-shrink-0">({stats.total})</span>
        </div>
        {/* Live status badges */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {stats.running > 0 && (
            <span className="text-xs bg-green-100 text-green-700 rounded-full px-1.5 py-0.5 font-medium animate-pulse">
              {stats.running}▶
            </span>
          )}
          {stats.error > 0 && (
            <span className="text-xs bg-red-100 text-red-700 rounded-full px-1.5 py-0.5 font-medium">
              {stats.error}!
            </span>
          )}
        </div>
      </div>

      {/* Add Task */}
      <div className="px-3 py-2 border-b bg-gray-50">
        <form onSubmit={handleCreateTask} className="flex gap-2 items-center">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a task..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          />
          {/* Assign-on-create toggle */}
          <button
            type="button"
            onClick={() => setAssignOnCreate(!assignOnCreate)}
            title={assignOnCreate ? 'Claude Codeに任せる（ON）' : 'Claude Codeに任せる（OFF）'}
            className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 focus:outline-none ${
              assignOnCreate ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
              assignOnCreate ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </button>
          <button
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 transition-opacity"
          >
            Add
          </button>
        </form>
      </div>

      {/* Task Items */}
      <div className="flex-1 overflow-y-auto p-3 pb-20">
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
