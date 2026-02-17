import { create } from 'zustand';

type MobileView = 'sidebar' | 'tasks' | 'detail';

interface UIStore {
  selectedListId: string | null;
  selectedTaskId: string | null;
  isDetailPanelOpen: boolean;
  mobileView: MobileView;
  selectList: (id: string | null) => void;
  selectTask: (id: string | null) => void;
  closeDetailPanel: () => void;
  setMobileView: (view: MobileView) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedListId: null,
  selectedTaskId: null,
  isDetailPanelOpen: false,
  mobileView: 'sidebar',
  selectList: (id) => set({ selectedListId: id, mobileView: 'tasks' }),
  selectTask: (id) => set({ selectedTaskId: id, isDetailPanelOpen: !!id, mobileView: id ? 'detail' : 'tasks' }),
  closeDetailPanel: () => set({ isDetailPanelOpen: false, selectedTaskId: null, mobileView: 'tasks' }),
  setMobileView: (view) => set({ mobileView: view }),
}));
