import { generateCleanerReport, getStoredCleanerReport } from './reports/generate-cleaner-report';
import { emitProgress } from './services/emit-progress';
import { cleanerSectionKeys } from '@/apps/renderer/pages/Settings/cleaner/cleaner.config';
import { CleanerViewModel } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';
import { CleanerModule as CoreCleanerModule } from '@internxt/drive-desktop-core/build/backend';

export const CleanerModule = {
  generateCleanerReport,
  getDiskSpace: () => CoreCleanerModule.getDiskSpace({ mainPath: 'C:\\' }),
  stopCleanup: CoreCleanerModule.stopCleanup,
  startCleanup: (viewModel: CleanerViewModel) => {
    const storedCleanerReport = getStoredCleanerReport();
    return CoreCleanerModule.startCleanup({ viewModel, storedCleanerReport, emitProgress, cleanerSectionKeys });
  },
};
