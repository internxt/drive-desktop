import { ipcMain } from 'electron';
import { CleanerReport, CleanerViewModel } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';
import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { generateCleanerReport, storedCleanerReport } from '../../../backend/features/cleaner/reports/generate-cleaner-report';
import { emitProgress } from '../../../backend/features/cleaner/services/emmit-progress';
import { cleanerSectionKeys } from '../../renderer/pages/Settings/Cleaner/cleaner.config';

ipcMain.handle('cleaner:generate-report', async (_, force = false): Promise<CleanerReport> => {
  return await generateCleanerReport(force);
});

ipcMain.handle('cleaner:start-cleanup', async (_, viewModel: CleanerViewModel): Promise<void> => {
  await CleanerModule.startCleanup({ viewModel, storedCleanerReport, emitProgress, cleanerSectionKeys });
});

ipcMain.handle('cleaner:stop-cleanup', async (): Promise<void> => {
  CleanerModule.stopCleanup();
});

ipcMain.handle('cleaner:get-disk-space', async (): Promise<number> => {
  return await CleanerModule.getDiskSpace({ mainPath: 'C:\\' });
});