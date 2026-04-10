import { useMemo } from 'react';
import { useUIStore, type RunnerStatusFilter } from '../../stores/uiStore';
import { useAllTasksFlat } from '../../hooks/useTasksQuery';

export const StatusOverlay = () => {
  const { runnerStatusFilter, setRunnerStatusFilter } = useUIStore();
  const allTasks = useAllTasksFlat();

  const counts = useMemo(() => {
    const assigned = allTasks.filter((t: any) => t.assignedToRunner);
    return {
      pending: assigned.filter((t: any) => t.runnerStatus === 'idle' || t.runnerStatus === 'running').length,
      needs_input: assigned.filter((t: any) => t.runnerStatus === 'needs_input').length,
      error: assigned.filter((t: any) => t.runnerStatus === 'error').length,
      done: assigned.filter((t: any) => t.runnerStatus === 'done').length,
    };
  }, [allTasks]);

  const toggle = (filter: RunnerStatusFilter) => {
    setRunnerStatusFilter(runnerStatusFilter === filter ? null : filter);
  };

  const btnBase =
    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border';
  const btnActive = 'bg-gray-900 text-white border-gray-900';
  const btnInactive = 'bg-white text-gray-700 border-gray-200 hover:border-gray-400';

  const total = counts.pending + counts.needs_input + counts.error + counts.done;
  if (total === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 pointer-events-none">
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-2 shadow-lg border border-gray-200 pointer-events-auto">
        {/* Button 1: idle + running */}
        <button
          onClick={() => toggle('pending')}
          className={`${btnBase} ${runnerStatusFilter === 'pending' ? btnActive : btnInactive}`}
          title="実行待ち・実行中"
        >
          <span className="flex items-center gap-0.5">
            <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          </span>
          <span>{counts.pending}</span>
        </button>

        {/* Button 2: needs_input */}
        <button
          onClick={() => toggle('needs_input')}
          className={`${btnBase} ${runnerStatusFilter === 'needs_input' ? btnActive : btnInactive}`}
          title="保留中（要確認）"
        >
          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
          <span>{counts.needs_input}</span>
        </button>

        {/* Button 3: error */}
        <button
          onClick={() => toggle('error')}
          className={`${btnBase} ${runnerStatusFilter === 'error' ? btnActive : btnInactive}`}
          title="エラー（再実行可）"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          <span>{counts.error}</span>
        </button>

        {/* Button 4: done */}
        <button
          onClick={() => toggle('done')}
          className={`${btnBase} ${runnerStatusFilter === 'done' ? btnActive : btnInactive}`}
          title="完了"
        >
          <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
          <span>{counts.done}</span>
        </button>

        {/* Clear filter */}
        {runnerStatusFilter && (
          <button
            onClick={() => setRunnerStatusFilter(null)}
            className="text-gray-400 hover:text-gray-700 px-1 text-base leading-none"
            title="フィルターを解除"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
