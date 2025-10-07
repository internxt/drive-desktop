import { stopCleanup } from '@internxt/drive-desktop-core/build/backend/features/cleaner/services/stop-cleanup';
import { generateCleanerReport, getStoredCleanerReport } from './reports/generate-cleaner-report';
import { getDiskSpace } from '@internxt/drive-desktop-core/build/backend/features/cleaner/utils/get-disk-space';
import { startCleanup } from '@internxt/drive-desktop-core/build/backend/features/cleaner/services/start-cleanup';
import { emitProgress } from './services/emit-progress';
import { cleanerSectionKeys } from '@/apps/renderer/pages/Settings/cleaner/cleaner.config';
import { CleanerViewModel } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';

export const CleanerModule = {
  generateCleanerReport,
  getDiskSpace: () => getDiskSpace({ mainPath: 'C:\\' }),
  stopCleanup,
  startCleanup: (viewModel: CleanerViewModel) => {
    const storedCleanerReport = getStoredCleanerReport();
    return startCleanup({ viewModel, storedCleanerReport, emitProgress, cleanerSectionKeys });
  },
};
