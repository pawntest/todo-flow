import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TaskList } from '../tasks/TaskList';
import { TaskDetail } from '../tasks/TaskDetail';
import { useUIStore } from '../../stores/uiStore';
import { useListsQuery } from '../../hooks/useListsQuery';

export const AppLayout = () => {
  const { selectedListId, selectList, isDetailPanelOpen, mobileView } = useUIStore();
  const { data: lists } = useListsQuery();

  useEffect(() => {
    if (!selectedListId && lists && lists.length > 0) {
      selectList(lists[0].id);
    }
  }, [lists, selectedListId, selectList]);

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex overflow-hidden">
          <TaskList />
          {isDetailPanelOpen && <TaskDetail />}
        </div>
      </div>

      {/* Mobile Layout - one panel at a time */}
      <div className="flex md:hidden h-screen bg-gray-50 overflow-hidden">
        <div className={`absolute inset-0 transition-transform duration-300 ${mobileView === 'sidebar' ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar />
        </div>
        <div className={`absolute inset-0 transition-transform duration-300 ${mobileView === 'tasks' ? 'translate-x-0' : mobileView === 'detail' ? '-translate-x-full' : 'translate-x-full'}`}>
          <TaskList />
        </div>
        <div className={`absolute inset-0 transition-transform duration-300 ${mobileView === 'detail' ? 'translate-x-0' : 'translate-x-full'}`}>
          {isDetailPanelOpen && <TaskDetail />}
        </div>
      </div>
    </>
  );
};
