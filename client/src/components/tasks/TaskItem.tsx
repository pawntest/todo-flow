import { useToggleTask, useDeleteTask, useCreateTask, useUpdateTask } from '../../hooks/useTasksQuery';
import { useUIStore } from '../../stores/uiStore';
import { useState } from 'react';
import { formatDueDate, getDueDateColor } from '../../utils/dateUtils';

interface TaskItemProps {
  task: any;
  depth: number;
}

const STATUS_DOT: Record<string, string> = {
  idle: 'bg-gray-400',
  running: 'bg-green-500',
  needs_input: 'bg-yellow-400',
  done: 'bg-purple-500',
};

export const TaskItem = ({ task, depth }: TaskItemProps) => {
  const { selectTask } = useUIStore();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();
  const createSubtask = useCreateTask();
  const updateTask = useUpdateTask();
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTask.mutate({ id: task.id, listId: task.listId, completed: !task.completed });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this task?')) {
      deleteTask.mutate(task.id);
    }
  };

  const handleToggleAssign = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newAssigned = !task.assignedToRunner;
    updateTask.mutate({
      id: task.id,
      listId: task.listId,
      data: {
        assignedToRunner: newAssigned,
        ...(newAssigned ? {} : { runnerStatus: 'idle' }),
      },
    });
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;
    await createSubtask.mutateAsync({
      title: subtaskTitle,
      listId: task.listId,
      parentId: task.id
    });
    setSubtaskTitle('');
    setShowSubtaskInput(false);
  };

  const dotColor = STATUS_DOT[task.runnerStatus ?? 'idle'] ?? STATUS_DOT.idle;

  return (
    <div>
      <div
        className={`flex items-start gap-3 px-3 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors ${
          depth > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''
        }`}
        onClick={() => selectTask(task.id, task.listId)}
      >
        {/* Checkbox with status dot */}
        <div
          className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center -ml-1"
          onClick={(e) => { e.stopPropagation(); handleToggle(e); }}
        >
          {task.assignedToRunner && (
            <span className={`absolute top-0 left-0 w-2.5 h-2.5 rounded-full ${dotColor} ring-2 ring-white`} />
          )}
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => {}}
            readOnly
            className="w-5 h-5 rounded-full border-2 border-gray-300 cursor-pointer accent-blue-600"
          />
        </div>

        <div className="flex-1 min-w-0 py-0.5">
          <div className={`text-base leading-snug ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {task.title}
          </div>
          {task.dueDate && (
            <div className={`text-xs mt-1 font-medium ${getDueDateColor(task.dueDate)}`}>
              📅 {formatDueDate(task.dueDate)}
            </div>
          )}
          {task.subtasks?.length > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              {task.subtasks.filter((s: any) => s.completed).length}/{task.subtasks.length} subtasks
            </div>
          )}
          {showSubtaskInput && (
            <form onSubmit={handleAddSubtask} className="mt-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                placeholder="Subtask title..."
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onBlur={() => setShowSubtaskInput(false)}
              />
            </form>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Orange toggle: assign to ClaudeCode */}
          <button
            onClick={handleToggleAssign}
            title={task.assignedToRunner ? 'ClaudeCodeから外す' : 'ClaudeCodeに任せる'}
            className={`relative w-9 h-5 rounded-full transition-colors focus:outline-none ${
              task.assignedToRunner ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                task.assignedToRunner ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>

          {depth < 2 && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowSubtaskInput(true); }}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-lg"
            >
              +
            </button>
          )}
          <button
            onClick={handleDelete}
            className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg text-lg"
          >
            ×
          </button>
        </div>
      </div>

      {task.subtasks && task.subtasks.length > 0 && (
        <div>
          {task.subtasks.map((subtask: any) => (
            <TaskItem key={subtask.id} task={subtask} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
