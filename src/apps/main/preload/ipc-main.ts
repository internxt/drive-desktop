import { CustomIpc } from '@/apps/shared/IPC/IPCs';
import { ipcMain } from 'electron';
import { FromMain, FromProcess } from './ipc';
import { calculateUsage } from '../usage/service';
import { getLastBackupProgress } from '../background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { getAvailableProducts } from '../payments/get-available-products';
import { CleanerModule } from '@/backend/features/cleaner/cleaner.module';
import { LoggerModule } from '@/apps/shared/logger/logger.module';
import { setConfigKey } from '../config/service';
import { getLanguage } from '../config/language';
import { getTheme } from '../config/theme';
import { chooseSyncRootWithDialog, getRootVirtualDrive, openVirtualDriveRootFolder } from '../virtual-root-folder/service';
import { downloadBackup } from '@/backend/features/backups/download/download-backup';
import { openLoginUrl } from '../auth/open-login-url';
import { deleteBackupsFromDevice } from '../device/service';
import { AuthContext } from '@/apps/sync-engine/config';
import { getSyncStatus } from '../remote-sync/services/broadcast-sync-status';
import { updateAllRemoteSync } from '../remote-sync/handlers';

const ipcPreloadMain = ipcMain as unknown as CustomIpc<FromMain, FromProcess>;

export function setupPreloadIpc() {
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
  ipcPreloadMain.handle('downloadBackup', (_, props) => downloadBackup(props));
  ipcPreloadMain.handle('openLoginUrl', () => Promise.resolve(openLoginUrl()));
  ipcPreloadMain.handle('getRemoteSyncStatus', () => Promise.resolve(getSyncStatus()));
  ipcPreloadMain.handle('syncManually', () => updateAllRemoteSync());
}

export function setupLoggedPreloadIpc({ ctx }: { ctx: AuthContext }) {
  ipcMain.handle('deleteBackupsFromDevice', (_, props) => deleteBackupsFromDevice({ ctx, ...props }));
}

export function clearLoggedPreloadIpc() {
  ipcMain.removeHandler('deleteBackupsFromDevice');
}
