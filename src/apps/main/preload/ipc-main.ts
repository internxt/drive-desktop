import { CustomIpc } from '@/apps/shared/IPC/IPCs';
import { ipcMain } from 'electron';
import { FromMain, FromProcess } from './ipc';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { calculateUsage } from '../usage/service';
import { getLastBackupProgress } from '../background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { getAvailableProducts } from '../payments/get-available-products';
import { CleanerModule } from '@/backend/features/cleaner/cleaner.module';

const ipcPreloadMain = ipcMain as unknown as CustomIpc<FromMain, FromProcess>;

export function setupPreloadIpc() {
  ipcPreloadMain.handle('authLogin', (_, props) => driveServerWip.auth.login(props));
  ipcPreloadMain.handle('authAccess', (_, props) => driveServerWip.auth.access(props));
  ipcPreloadMain.on('getLastBackupProgress', () => getLastBackupProgress());
  ipcPreloadMain.handle('getUsage', () => calculateUsage());
  ipcPreloadMain.handle('getAvailableProducts', () => getAvailableProducts());
  ipcPreloadMain.handle('cleanerGenerateReport', (_, props) => CleanerModule.generateCleanerReport(props));
  ipcPreloadMain.handle('cleanerStartCleanup', (_, props) => CleanerModule.startCleanup(props));
  ipcPreloadMain.handle('cleanerGetDiskSpace', () => CleanerModule.getDiskSpace());
  ipcPreloadMain.on('cleanerStopCleanup', () => CleanerModule.stopCleanup());
}
