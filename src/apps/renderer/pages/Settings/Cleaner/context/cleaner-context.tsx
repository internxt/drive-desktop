import { createContext, ReactNode, useEffect, useState } from 'react';

import { CleanerContextType } from '@internxt/drive-desktop-core/src/frontend/features/cleaner/cleaner.types';
import {
  CleanerViewModel,
  CleanupProgress,
  ExtendedCleanerReport,
} from '@internxt/drive-desktop-core/src/backend/features/cleaner/types/cleaner.types';
import { logger } from '@/apps/shared/logger/logger';
import { formatFileSize } from '@internxt/drive-desktop-core/src/frontend/features/cleaner/cleaner.service';

const CleanerContext = createContext<CleanerContextType | undefined>(undefined);

export function CleanerProvider({ children }: { children: ReactNode }) {
  const [report, setReport] = useState<ExtendedCleanerReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [diskSpace, setDiskSpace] = useState(0);
  const [isCleanerAvailable, setIsCleanerAvailable] = useState<boolean>(false);

  const initialCleaningState = {
    cleaning: false,
    cleaningCompleted: false,
    currentCleaningPath: '',
    progress: 0,
    deletedFiles: 0,
    spaceGained: '0 B',
  };
  const [cleaningState, setCleaningState] = useState(initialCleaningState);

  async function generateReport(force = false) {
    if (loading) return;
    setReport(null);
    setLoading(true);
    try {
      const report: ExtendedCleanerReport = await window.electron.cleaner.generateReport(force);
      const diskSpace = await window.electron.cleaner.getDiskSpace();
      setReport(report);
      setDiskSpace(diskSpace);
    } finally {
      setLoading(false);
    }
  }

  function startCleanup(viewModel: CleanerViewModel) {
    window.electron.cleaner.startCleanup(viewModel).catch((error) => {
      logger.error({ msg: 'Failed to start cleanup:', error });
    });
  }

  function stopCleanup() {
    window.electron.cleaner.stopCleanup().catch((error) => {
      logger.error({ msg: 'Failed to stop cleanup:', error });
    });
  }
  useEffect(() => {
    window.electron.cleaner
      .isAvailable()
      .then(setIsCleanerAvailable)
      .catch((error) => {
        logger.error({ msg: 'Failed to check availability for the cleaner:', error });
      });
  }, []);

  useEffect(() => {
    const handleCleanupProgress = (progressData: CleanupProgress) => {
      setCleaningState({
        cleaning: progressData.cleaning,
        cleaningCompleted: progressData.cleaningCompleted,
        currentCleaningPath: progressData.currentCleaningPath,
        progress: progressData.progress,
        deletedFiles: progressData.deletedFiles,
        spaceGained: formatFileSize(progressData.spaceGained),
      });
    };

    return window.electron.cleaner.onCleanupProgress(handleCleanupProgress);
  }, []);

  function setInitialCleaningState() {
    setCleaningState(initialCleaningState);
  }

  return (
    <CleanerContext.Provider
      value={{
        report,
        loading,
        isCleanerAvailable,
        cleaningState,
        diskSpace,
        sectionKeys: [], // This is just a placeholder
        generateReport,
        startCleanup,
        stopCleanup,
        setInitialCleaningState,
      }}>
      {children}
    </CleanerContext.Provider>
  );
}
