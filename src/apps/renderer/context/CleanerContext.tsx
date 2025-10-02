import { createContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { getAvailableProducts } from '@/apps/main/payments/get-available-products';
import { CleanerViewModel, CleanupProgress } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';
import { CleanerModule } from '@internxt/drive-desktop-core/build/frontend';
import { CleanerContextType } from '@internxt/drive-desktop-core/build/frontend/features/cleaner/cleaner.types';
import { cleanerSectionKeys } from '@/apps/renderer/pages/Settings/Cleaner/cleaner.config';
import { WindowsCleanerReport } from '../pages/Settings/Cleaner/cleaner.types';

export const CleanerContext = createContext<CleanerContextType<WindowsCleanerReport> | undefined>(undefined);

export function CleanerProvider({ children }: { children: ReactNode }) {
  const [report, setReport] = useState<WindowsCleanerReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [diskSpace, setDiskSpace] = useState(0);
  const [products, setProducts] = useState<any>(null);

  useEffect(() => {
    const loadProducts = async () => {
      const products = await window.electron.getAvailableProducts();
      setProducts(products);
    };
    loadProducts();
  }, []);

  const isCleanerAvailable = useMemo(() => {
    return Boolean(products?.cleaner);
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
      const report: WindowsCleanerReport = await window.electron.cleaner.generateReport(force);
      const diskSpace = await window.electron.cleaner.getDiskSpace();
      setReport(report);
      setDiskSpace(diskSpace);
    } finally {
      setLoading(false);
    }
  };

  const startCleanup = (viewModel: CleanerViewModel) => {
    try {
      window.electron.cleaner.startCleanup(viewModel);
    } catch (error) {
      console.error('Failed to start cleanup:', error);
    }
  };

  const stopCleanup = () => {
    try {
      window.electron.cleaner.stopCleanup();
    } catch (error) {
      console.error('Failed to stop cleanup:', error);
    }
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

    const removeListener = window.electron.cleaner.onCleanupProgress(handleCleanupProgress);

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
