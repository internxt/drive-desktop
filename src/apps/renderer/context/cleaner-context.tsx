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

export function CleanerProvider({ children }: { children: ReactNode }) {
  const [report, setReport] = useState<CleanerReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [diskSpace, setDiskSpace] = useState(0);
  const [products, setProducts] = useState<{ backups: boolean; antivirus: boolean; cleaner: boolean } | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      const products = await window.electron.getAvailableProducts();
      setProducts(products ?? null);
    };
    void loadProducts();
  }, []);

  const isCleanerAvailable = useMemo(() => {
    return Boolean(true);
  }, [products]);
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
      const report = await globalThis.window.electron.cleanerGenerateReport(force);
      const diskSpace = await globalThis.window.electron.cleanerGetDiskSpace();
      setReport(report);
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

    const removeListener = globalThis.window.electron.cleanerOnProgress(handleCleanupProgress);

    return () => {
      if (typeof removeListener === 'function') {
        removeListener();
      }
    };
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
        generateReport,
        startCleanup,
        stopCleanup,
        setInitialCleaningState,
        sectionKeys: cleanerSectionKeys,
      }}>
      {children}
    </CleanerContext.Provider>
  );
}
