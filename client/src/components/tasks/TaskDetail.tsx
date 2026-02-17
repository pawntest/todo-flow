import { useState, useEffect } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useTasksQuery, useUpdateTask, useToggleTask } from '../../hooks/useTasksQuery';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export const TaskDetail = () => {
  const { selectedTaskId, selectedListId, closeDetailPanel } = useUIStore();
  const { data: tasks } = useTasksQuery(selectedListId);
  const updateTask = useUpdateTask();
  const toggleTask = useToggleTask();
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);

  const findTask = (tasks: any[], id: string): any => {
    for (const task of tasks) {
      if (task.id === id) return task;
      if (task.subtasks) {
        const found = findTask(task.subtasks, id);
        if (found) return found;
      }
    }
    return null;
  };

  const actualTask = tasks ? findTask(tasks, selectedTaskId || '') : null;

  useEffect(() => {
    if (actualTask) {
      setNotes(actualTask.notes || '');
      setDueDate(actualTask.dueDate ? new Date(actualTask.dueDate) : null);
    }
  }, [actualTask?.id]);

  const handleNotesBlur = () => {
    if (actualTask && notes !== actualTask.notes) {
      updateTask.mutate({ id: actualTask.id, data: { notes } });
    }
  };

  const handleDueDateChange = (date: Date | null) => {
    setDueDate(date);
    if (actualTask) {
      updateTask.mutate({ id: actualTask.id, data: { dueDate: date } });
    }
  };

  if (!actualTask) return null;

  return (
    <div className="w-full md:w-96 h-full border-l bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3">
        <button
          onClick={closeDetailPanel}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 text-lg"
          aria-label="Close"
        >
          ←
        </button>
        <h2 className="font-semibold text-gray-800 flex-1">Task Details</h2>
        <button
          onClick={closeDetailPanel}
          className="hidden md:block p-2 rounded-lg hover:bg-gray-100 text-gray-500 text-xl"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Task Title + Completion */}
        <div className="p-4 border-b flex items-start gap-3">
          <input
            type="checkbox"
            checked={actualTask.completed}
            onChange={() => toggleTask.mutate(actualTask.id)}
            className="mt-1 w-5 h-5 rounded border-gray-300 cursor-pointer"
          />
          <span className={`text-base font-medium flex-1 ${actualTask.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {actualTask.title}
          </span>
        </div>

        <div className="p-4 space-y-5">
          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Due Date
            </label>
            <DatePicker
              selected={dueDate}
              onChange={handleDueDateChange}
              className="w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholderText="Set due date..."
              dateFormat="MMM d, yyyy"
              isClearable
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add notes..."
              rows={6}
              className="w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
