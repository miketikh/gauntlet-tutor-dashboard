import { create } from 'zustand';

type SessionFilter = 'all' | 'flagged' | 'high_scoring';

interface DashboardStore {
  sessionFilter: SessionFilter;
  setSessionFilter: (filter: SessionFilter) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  sessionFilter: 'all',
  setSessionFilter: (filter) => set({ sessionFilter: filter }),
}));
