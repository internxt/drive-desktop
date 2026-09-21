import { create } from 'zustand';

export const sectionValues = ['GENERAL', 'ACCOUNT', 'BACKUPS', 'ANTIVIRUS', 'CLEANER', 'MAIL_BRIDGE'] as const;
export type Section = (typeof sectionValues)[number];

type Store = {
  activeSection: Section | null;
  setActiveSection: (value: Section | null) => void;
};

export const useSettingsStore = create<Store>((set) => ({
  activeSection: null,
  setActiveSection: (value) => set(() => ({ activeSection: value })),
}));
