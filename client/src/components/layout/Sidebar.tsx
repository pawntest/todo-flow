import { useState } from 'react';
import { useListsQuery, useCreateList, useDeleteList } from '../../hooks/useListsQuery';
import { useUIStore } from '../../stores/uiStore';

export const Sidebar = () => {
  const { selectedListId, selectList } = useUIStore();
  const { data: lists, isLoading } = useListsQuery();
  const createList = useCreateList();
  const deleteList = useDeleteList();
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    await createList.mutateAsync({ name: newListName });
    setNewListName('');
    setIsCreating(false);
  };

  const handleDeleteList = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this list and all its tasks?')) {
      deleteList.mutate(id);
      if (selectedListId === id) selectList(null);
    }
  };

  if (isLoading) return (
    <div className="w-full md:w-64 h-full bg-white border-r p-4 flex flex-col">
      <div className="p-4 border-b"><h1 className="text-xl font-bold text-gray-800">Todo Flow</h1></div>
      <div className="p-4 text-gray-500">Loading lists...</div>
    </div>
  );

  return (
    <div className="w-full md:w-64 h-full bg-white border-r flex flex-col">
      <div className="p-4 border-b flex items-center gap-3">
        <span className="text-2xl">📝</span>
        <h1 className="text-xl font-bold text-gray-800">Todo Flow</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">My Lists</p>
        {lists?.map((list: any) => (
          <div
            key={list.id}
            onClick={() => { if (window.innerWidth < 768) selectList(list.id); }}
            className="flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer mb-1 transition-colors hover:bg-gray-100 text-gray-700"
          >
            <div className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: list.color || '#6b7280' }}
              />
              <span className="font-medium">{list.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                {list._count?.tasks || 0}
              </span>
              <button
                onClick={(e) => handleDeleteList(list.id, e)}
                className="text-gray-300 hover:text-red-500 text-lg leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-red-50"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t">
        {isCreating ? (
          <form onSubmit={handleCreateList} className="space-y-2">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="List name..."
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                Create
              </button>
              <button type="button" onClick={() => setIsCreating(false)} className="px-3 py-2 text-gray-600 text-sm">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full px-3 py-3 text-left text-blue-600 hover:bg-blue-50 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <span className="text-lg">+</span> New List
          </button>
        )}
      </div>
    </div>
  );
};
