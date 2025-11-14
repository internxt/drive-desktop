import { CustomIpc } from '@/apps/shared/IPC/IPCs';
import { ipcMain } from 'electron';
import { FromMain, FromProcess } from './ipc';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { calculateUsage } from '../usage/service';
import { getLastBackupProgress } from '../background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { getAvailableProducts } from '../payments/get-available-products';
import { CleanerModule } from '@/backend/features/cleaner/cleaner.module';
import { LoggerModule } from '@/apps/shared/logger/logger.module';
import { setConfigKey } from '../config/service';
import { getLanguage } from '../config/language';
import { getTheme } from '../config/theme';
import { chooseSyncRootWithDialog, getRootVirtualDrive, openVirtualDriveRootFolder } from '../virtual-root-folder/service';

const ipcPreloadMain = ipcMain as unknown as CustomIpc<FromMain, FromProcess>;

export function setupPreloadIpc() {
  ipcPreloadMain.handle('authLogin', (_, props) => driveServerWip.auth.login(props));
  ipcPreloadMain.handle('authAccess', (_, props) => driveServerWip.auth.access(props));
  ipcPreloadMain.handle('getLastBackupProgress', () => Promise.resolve(getLastBackupProgress()));
  ipcPreloadMain.handle('getUsage', () => calculateUsage());
  ipcPreloadMain.handle('getAvailableProducts', () => getAvailableProducts());
  ipcPreloadMain.handle('cleanerGenerateReport', (_, props) => CleanerModule.generateCleanerReport(props));
  ipcPreloadMain.handle('cleanerStartCleanup', (_, props) => CleanerModule.startCleanup(props));
  ipcPreloadMain.handle('cleanerGetDiskSpace', () => CleanerModule.getDiskSpace());
  ipcPreloadMain.handle('cleanerStopCleanup', () => Promise.resolve(CleanerModule.stopCleanup()));
  ipcPreloadMain.handle('openLogs', () => LoggerModule.openLogs());
  ipcPreloadMain.handle('getTheme', () => Promise.resolve(getTheme()));
  ipcPreloadMain.handle('getLanguage', () => Promise.resolve(getLanguage()));
  ipcPreloadMain.handle('setConfigKey', (_, props) => Promise.resolve(setConfigKey(props)));
  ipcPreloadMain.handle('driveGetSyncRoot', () => getRootVirtualDrive());
  ipcPreloadMain.handle('driveChooseSyncRootWithDialog', () => chooseSyncRootWithDialog());
  ipcPreloadMain.handle('driveOpenSyncRootFolder', () => openVirtualDriveRootFolder());
}
