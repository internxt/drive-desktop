import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
  useMemo,
} from 'react';
import { useUserAvailableProducts } from '../hooks/useUserAvailableProducts/useUserAvailableProducts';
import {
  CleanerReport,
  CleanerViewModel,
  CleanupProgress,
} from '../../../backend/features/cleaner/cleaner.types';
type CleanerContextType = {
  report: CleanerReport | null;
  loading: boolean;
  isCleanerAvailable: boolean;
  cleaningState: {
    cleaning: boolean;
    cleaningCompleted: boolean;
    currentCleaningPath: string;
    progress: number;
    deletedFiles: number;
    spaceGained: string;
  };
  diskSpace: number;
  generateReport: (force?: boolean) => Promise<void>;
  startCleanup: (viewModel: CleanerViewModel) => void;
  stopCleanup: () => void;
  setInitialCleaningState: () => void;
};

const CleanerContext = createContext<CleanerContextType | undefined>(undefined);

export function CleanerProvider({ children }: { children: ReactNode }) {
  const [report, setReport] = useState<CleanerReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [diskSpace, setDiskSpace] = useState(0);

  const { products } = useUserAvailableProducts();
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

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    );
  };

  const generateReport = async (force = false) => {
    if (loading) return;
    setReport(null);
    setLoading(true);
    try {
      const report: CleanerReport =
        await window.electron.cleaner.generateReport(force);
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

  // Listen for cleanup progress updates from main process
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

    // Add listener for cleanup progress updates
    const removeListener = window.electron.cleaner.onCleanupProgress(
      handleCleanupProgress
    );

    // Cleanup listener on unmount
    return removeListener;
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
      }}
    >
      {children}
    </CleanerContext.Provider>
  );
}

export function useCleaner(): CleanerContextType {
  const ctx = useContext(CleanerContext);
  if (!ctx) throw new Error('useCleaner must be used inside <CleanerProvider>');
  return ctx;
}
