import { ipcMain } from 'electron';
import { CleanerReport, CleanerViewModel } from '../cleaner.types';
import { generateCleanerReport } from '../generate-cleaner-report';
import { startCleanup, stopCleanup } from '../clean-service';
import { getDiskSpace } from '../utils/get-disk-space';

ipcMain.handle('cleaner:generate-report', async (_, force = false): Promise<CleanerReport> => {
  return await generateCleanerReport(force);
});

ipcMain.handle('cleaner:start-cleanup', async (_, viewModel: CleanerViewModel): Promise<void> => {
  await startCleanup(viewModel);
});

ipcMain.handle('cleaner:stop-cleanup', async (): Promise<void> => {
  stopCleanup();
});

ipcMain.handle('cleaner:get-disk-space', async (): Promise<number> => {
  return await getDiskSpace();
});
