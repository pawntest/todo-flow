import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useTasksQuery, useUpdateTask, useToggleTask } from '../../hooks/useTasksQuery';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface LogEntry {
  role: 'system' | 'assistant' | 'user';
  content: string;
  ts: string;
}

function parseLog(raw: string | undefined | null): LogEntry[] {
  try { return JSON.parse(raw ?? '[]'); } catch { return []; }
}

function formatTime(ts: string) {
  try { return new Date(ts).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  idle:        { label: '待機中',   color: 'bg-gray-100 text-gray-600' },
  running:     { label: '実行中',   color: 'bg-green-100 text-green-700' },
  needs_input: { label: '要確認',   color: 'bg-yellow-100 text-yellow-700' },
  error:       { label: 'エラー',   color: 'bg-red-100 text-red-600' },
  done:        { label: '完了',     color: 'bg-purple-100 text-purple-700' },
};

export const TaskDetail = () => {
  const { selectedTaskId, selectedListId, closeDetailPanel } = useUIStore();
  const { data: tasks } = useTasksQuery(selectedListId);
  const updateTask = useUpdateTask();
  const toggleTask = useToggleTask();

  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [userMessage, setUserMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'log' | 'notes'>('log');
  const logEndRef = useRef<HTMLDivElement>(null);

  const findTask = (tasks: any[], id: string): any => {
    for (const task of tasks) {
      if (task.id === id) return task;
      if (task.subtasks) { const f = findTask(task.subtasks, id); if (f) return f; }
    }
    return null;
  };

  const actualTask = tasks ? findTask(tasks, selectedTaskId || '') : null;
  const logEntries = parseLog(actualTask?.runnerLog);
  const statusInfo = STATUS_LABEL[actualTask?.runnerStatus ?? 'idle'] ?? STATUS_LABEL.idle;

  useEffect(() => {
    if (actualTask) {
      setNotes(actualTask.notes || '');
      setDueDate(actualTask.dueDate ? new Date(actualTask.dueDate) : null);
    }
  }, [actualTask?.id]);

  // Scroll to bottom when new log entries arrive
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logEntries.length]);

  const handleNotesBlur = () => {
    if (actualTask && notes !== actualTask.notes) {
      updateTask.mutate({ id: actualTask.id, listId: actualTask.listId, data: { notes } });
    }
  };

  const handleDueDateChange = (date: Date | null) => {
    setDueDate(date);
    if (actualTask) {
      updateTask.mutate({ id: actualTask.id, listId: actualTask.listId, data: { dueDate: date } });
    }
  };

  const handleSendMessage = () => {
    if (!userMessage.trim() || !actualTask) return;
    const newEntry: LogEntry = { role: 'user', content: userMessage.trim(), ts: new Date().toISOString() };
    const updatedLog = [...logEntries, newEntry];
    updateTask.mutate({
      id: actualTask.id,
      listId: actualTask.listId,
      data: {
        runnerLog: JSON.stringify(updatedLog),
        runnerStatus: 'idle', // re-queue for runner
      },
    });
    setUserMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!actualTask) return null;

  const isRunning = actualTask.runnerStatus === 'running';
  const canSendMessage = actualTask.assignedToRunner && !isRunning;

  return (
    <div className="w-full md:w-96 h-full border-l bg-white flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-3 flex-shrink-0">
        <button onClick={closeDetailPanel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 text-lg">←</button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={actualTask.completed}
              onChange={() => toggleTask.mutate({ id: actualTask.id, listId: selectedListId!, completed: !actualTask.completed })}
              className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-blue-600 flex-shrink-0"
            />
            <span className={`text-sm font-semibold truncate ${actualTask.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {actualTask.title}
            </span>
          </div>
          {actualTask.assignedToRunner && (
            <div className="mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color} ${isRunning ? 'animate-pulse' : ''}`}>
                {isRunning && '⟳ '}{statusInfo.label}
              </span>
            </div>
          )}
        </div>
        <button onClick={closeDetailPanel} className="hidden md:flex p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 text-xl">×</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b flex-shrink-0">
        <button
          onClick={() => setActiveTab('log')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'log' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          実行ログ
          {logEntries.length > 0 && <span className="ml-1 text-xs bg-gray-100 text-gray-500 rounded-full px-1.5">{logEntries.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'notes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          メモ・日付
        </button>
      </div>

      {/* Log Tab */}
      {activeTab === 'log' && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {logEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm py-12">
                <div className="text-4xl mb-3">🤖</div>
                <p>まだ実行ログはありません</p>
                {!actualTask.assignedToRunner && (
                  <p className="text-xs mt-1">タスクをClaudeCodeに割り当てると<br />ここに進捗が表示されます</p>
                )}
              </div>
            ) : (
              logEntries.map((entry, i) => {
                if (entry.role === 'system') {
                  return (
                    <div key={i} className="flex justify-center">
                      <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                        {entry.content}
                        <span className="ml-1.5 text-gray-300">{formatTime(entry.ts)}</span>
                      </span>
                    </div>
                  );
                }
                if (entry.role === 'assistant') {
                  return (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">🤖</div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap break-words">
                          {entry.content}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 ml-1">{formatTime(entry.ts)}</div>
                      </div>
                    </div>
                  );
                }
                // user
                return (
                  <div key={i} className="flex gap-2 items-start justify-end">
                    <div className="flex-1 min-w-0 flex flex-col items-end">
                      <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-white whitespace-pre-wrap break-words max-w-[85%]">
                        {entry.content}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 mr-1">{formatTime(entry.ts)}</div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">👤</div>
                  </div>
                );
              })
            )}
            {isRunning && (
              <div className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-sm flex-shrink-0">🤖</div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2">
                  <span className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={logEndRef} />
          </div>

          {/* Chat input */}
          {canSendMessage && (
            <div className="border-t p-3 flex-shrink-0">
              <div className="flex gap-2 items-end">
                <textarea
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={actualTask.runnerStatus === 'needs_input' || actualTask.runnerStatus === 'error'
                    ? 'ClaudeCodeへの指示を入力... (⌘+Enter で送信・再実行)'
                    : 'ClaudeCodeへのコメントを入力... (⌘+Enter で送信)'}
                  rows={2}
                  className="flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!userMessage.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 transition-opacity flex-shrink-0"
                >
                  送信
                </button>
              </div>
              {(actualTask.runnerStatus === 'needs_input' || actualTask.runnerStatus === 'error') && (
                <p className="text-xs text-gray-400 mt-1.5">送信すると自動で再実行キューに追加されます</p>
              )}
            </div>
          )}
        </>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📅 期限</label>
            <DatePicker
              selected={dueDate}
              onChange={handleDueDateChange}
              className="w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholderText="期限を設定..."
              dateFormat="yyyy/MM/dd"
              isClearable
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📝 メモ</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="メモを追加... (ClaudeCodeへの補足情報としても使われます)"
              rows={8}
              className="w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">ここに書いた内容はClaudeCodeが参照します</p>
          </div>
        </div>
      )}
    </div>
  );
};
