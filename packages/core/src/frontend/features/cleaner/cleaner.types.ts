import { CleanerSectionKey, CleanerViewModel, CleanerReport } from '@/backend/features/cleaner/types/cleaner.types';

export type SectionConfig = Record<CleanerSectionKey, { name: string; color: string }>;

export type CleanerContextType = {
  report: CleanerReport | null;
  loading: boolean;
  cleaningState: {
    cleaning: boolean;
    cleaningCompleted: boolean;
    currentCleaningPath: string;
    progress: number;
    deletedFiles: number;
    spaceGained: string;
  };
  diskSpace: number;
  sectionKeys: CleanerSectionKey[];
  generateReport: (force?: boolean) => Promise<void>;
  startCleanup: (viewModel: CleanerViewModel) => Promise<void>;
  stopCleanup: () => void;
  setInitialCleaningState: () => void;
};
