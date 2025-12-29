import { createContext, ReactNode, useState, useEffect, useMemo } from 'react';
import {
  CleanerReport,
  CleanerViewModel,
  CleanupProgress,
} from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';
import { CleanerModule } from '@internxt/drive-desktop-core/build/frontend';
import { CleanerContextType } from '@internxt/drive-desktop-core/build/frontend/features/cleaner/cleaner.types';
import { cleanerSectionKeys } from '@/apps/renderer/pages/Settings/cleaner/cleaner.config';

export const CleanerContext = createContext<CleanerContextType | undefined>(undefined);

type Props = { children: ReactNode };

export function CleanerProvider({ children }: Readonly<Props>) {
  const [report, setReport] = useState<CleanerReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [diskSpace, setDiskSpace] = useState(0);

  const initialCleaningState = {
    cleaning: false,
    cleaningCompleted: false,
    currentCleaningPath: '',
    progress: 0,
    deletedFiles: 0,
    spaceGained: '0 B',
  };
  const [cleaningState, setCleaningState] = useState(initialCleaningState);

  const generateReport = async (force = false) => {
    if (loading) return;
    setReport(null);
    setLoading(true);
    try {
      const report = await globalThis.window.electron.cleanerGenerateReport({ force });
      const diskSpace = await globalThis.window.electron.cleanerGetDiskSpace();
      setReport(report as Partial<CleanerReport> as CleanerReport);
      setDiskSpace(diskSpace);
    } finally {
      setLoading(false);
    }
  };

  const startCleanup = async (viewModel: CleanerViewModel) => {
    await globalThis.window.electron.cleanerStartCleanup(viewModel);
  };

  const stopCleanup = () => {
    globalThis.window.electron.cleanerStopCleanup();
  };

  useEffect(() => {
    const handleCleanupProgress = (progressData: CleanupProgress) => {
      setCleaningState({
        cleaning: progressData.cleaning,
        cleaningCompleted: progressData.cleaningCompleted,
        currentCleaningPath: progressData.currentCleaningPath,
        progress: progressData.progress,
        deletedFiles: progressData.deletedFiles,
        spaceGained: CleanerModule.formatFileSize({ bytes: progressData.spaceGained }),
      });
    };

    return globalThis.window.electron.cleanerOnProgress(handleCleanupProgress);
  }, []);

  function setInitialCleaningState() {
    setCleaningState(initialCleaningState);
  }

  const value = useMemo(
    () => ({
      report,
      loading,
      cleaningState,
      diskSpace,
      generateReport,
      startCleanup,
      stopCleanup,
      setInitialCleaningState,
      sectionKeys: cleanerSectionKeys,
    }),
    [report, loading, cleaningState, diskSpace, generateReport, startCleanup, stopCleanup, setInitialCleaningState],
  );

  return <CleanerContext.Provider value={value}>{children}</CleanerContext.Provider>;
}
