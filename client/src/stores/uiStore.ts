import { create } from 'zustand';

type MobileView = 'sidebar' | 'tasks' | 'detail';
export type RunnerStatusFilter = 'pending' | 'needs_input' | 'done' | null;

interface UIStore {
  selectedListId: string | null;
  selectedTaskId: string | null;
  isDetailPanelOpen: boolean;
  mobileView: MobileView;
  runnerStatusFilter: RunnerStatusFilter;
  selectList: (id: string | null) => void;
  selectTask: (id: string | null) => void;
  closeDetailPanel: () => void;
  setMobileView: (view: MobileView) => void;
  setRunnerStatusFilter: (filter: RunnerStatusFilter) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedListId: null,
  selectedTaskId: null,
  isDetailPanelOpen: false,
  mobileView: 'sidebar',
  runnerStatusFilter: null,
  selectList: (id) => set({ selectedListId: id, mobileView: 'tasks' }),
  selectTask: (id) => set({ selectedTaskId: id, isDetailPanelOpen: !!id, mobileView: id ? 'detail' : 'tasks' }),
  closeDetailPanel: () => set({ isDetailPanelOpen: false, selectedTaskId: null, mobileView: 'tasks' }),
  setMobileView: (view) => set({ mobileView: view }),
  setRunnerStatusFilter: (filter) => set({ runnerStatusFilter: filter }),
}));
