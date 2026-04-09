import { Sidebar } from './Sidebar';
import { TaskList } from '../tasks/TaskList';
import { TaskDetail } from '../tasks/TaskDetail';
import { StatusOverlay } from '../ui/StatusOverlay';
import { useUIStore } from '../../stores/uiStore';
import { useListsQuery } from '../../hooks/useListsQuery';

export const AppLayout = () => {
  const { selectedListId, isDetailPanelOpen, mobileView } = useUIStore();
  const { data: lists } = useListsQuery();

  return (
    <>
      {/* Desktop Layout - Board View */}
      <div className="hidden md:flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex overflow-hidden relative">
          {/* Horizontal scrollable board */}
          <div className="flex-1 flex overflow-x-auto overflow-y-hidden gap-4 p-4 pb-20">
            {lists?.map((list: any) => (
              <TaskList key={list.id} listId={list.id} />
            ))}
            {(!lists || lists.length === 0) && (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                サイドバーからリストを作成してください
              </div>
            )}
          </div>
          {isDetailPanelOpen && (
            <div className="absolute right-0 top-0 h-full z-10 shadow-xl">
              <TaskDetail />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout - one panel at a time */}
      <div className="relative flex md:hidden h-screen bg-gray-50 overflow-hidden">
        <div className={`absolute inset-0 transition-transform duration-300 ${mobileView === 'sidebar' ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar />
        </div>
        <div className={`absolute inset-0 transition-transform duration-300 ${mobileView === 'tasks' ? 'translate-x-0' : mobileView === 'detail' ? '-translate-x-full' : 'translate-x-full'}`}>
          {selectedListId && <TaskList listId={selectedListId} />}
        </div>
        <div className={`absolute inset-0 transition-transform duration-300 ${mobileView === 'detail' ? 'translate-x-0' : 'translate-x-full'}`}>
          {isDetailPanelOpen && <TaskDetail />}
        </div>
      </div>

      <StatusOverlay />
    </>
  );
};
