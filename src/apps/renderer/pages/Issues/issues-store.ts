import { create } from 'zustand';

export type Section = 'app' | 'virtualDrive' | 'backups';

type Store = {
  activeSection: Section | null;
  setActiveSection: (value: Section | null) => void;
};

export const useIssuesStore = create<Store>((set) => ({
  activeSection: null,
  setActiveSection: (value) => set(() => ({ activeSection: value })),
}));
