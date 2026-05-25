import { ipcMain } from 'electron';
import { CustomIpc } from '@/apps/shared/IPC/IPCs';
import { LoggerModule } from '@/apps/shared/logger/logger.module';
import { AuthContext } from '@/apps/sync-engine/config';
import { downloadBackup } from '@/backend/features/backups/download/download-backup';
import { CleanerModule } from '@/backend/features/cleaner/cleaner.module';
import { isUserLoggedIn } from '../auth/handlers';
import { openLoginUrl } from '../auth/open-login-url';
import { getLastBackupProgress } from '../background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { backupsSetInterval, backupsStartProcess } from '../background-processes/backups/setUpBackups';
import { getLanguage } from '../config/language';
import { setConfigKey } from '../config/service';
import { getTheme } from '../config/theme';
import { getBackupsFromDevice } from '../device/get-backups-from-device';
import { addBackup, deleteBackupsFromDevice, disableBackup, getDevices, getOrCreateDevice, renameDevice } from '../device/service';
import { getAvailableProducts } from '../payments/get-available-products';
import { getItemsByFolderUuid, updateAllRemoteSync } from '../remote-sync/handlers';
import { getSyncStatus } from '../remote-sync/services/broadcast-sync-status';
import { calculateUsage } from '../usage/service';
import { chooseSyncRootWithDialog, getRootVirtualDrive, openVirtualDriveRootFolder } from '../virtual-root-folder/service';
import { finishOnboarding } from '../windows';
import { getWorkArea, hideFrontend } from '../windows/widget';
import { FromMain, FromProcess } from './ipc';

export const ipcPreloadMain = ipcMain as unknown as CustomIpc<FromMain, FromProcess>;

export function setupPreloadIpc() {
  ipcPreloadMain.handle('getWorkArea', () => Promise.resolve(getWorkArea()));
  ipcPreloadMain.handle('hideFrontend', () => Promise.resolve(hideFrontend()));
  ipcPreloadMain.handle('isUserLoggedIn', () => Promise.resolve(isUserLoggedIn()));
  ipcPreloadMain.handle('finishOnboarding', () => finishOnboarding());
  ipcPreloadMain.handle('getLastBackupProgress', () => Promise.resolve(getLastBackupProgress()));
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
  ipcPreloadMain.handle('driveOpenSyncRootFolder', () => openVirtualDriveRootFolder());
  ipcPreloadMain.handle('openLoginUrl', () => Promise.resolve(openLoginUrl()));
  ipcPreloadMain.handle('getRemoteSyncStatus', () => Promise.resolve(getSyncStatus()));
  ipcPreloadMain.handle('syncManually', () => updateAllRemoteSync());
  ipcPreloadMain.handle('disableBackup', (_, props) => Promise.resolve(disableBackup(props)));
}

export function setupLoggedPreloadIpc({ ctx }: { ctx: AuthContext }) {
  ipcPreloadMain.handle('getUsage', () => calculateUsage({ ctx }));
  ipcPreloadMain.handle('driveChooseSyncRootWithDialog', () => chooseSyncRootWithDialog({ ctx }));

  // Backups
  ipcPreloadMain.handle('deleteBackupsFromDevice', (_, props) => deleteBackupsFromDevice({ ctx, ...props }));
  ipcPreloadMain.handle('backupsSetInterval', (_, props) => Promise.resolve(backupsSetInterval({ ctx, ...props })));
  ipcPreloadMain.handle('backupsStartProcess', () => backupsStartProcess({ ctx }));
  ipcPreloadMain.handle('downloadBackup', (_, props) => downloadBackup({ ctx, ...props }));
  ipcPreloadMain.handle('deleteBackupsFromDevice', (_, props) => deleteBackupsFromDevice({ ctx, ...props }));
  ipcPreloadMain.handle('getDevices', (_, props) => getDevices({ ctx, ...props }));
  ipcPreloadMain.handle('getBackupsFromDevice', (_, props) => getBackupsFromDevice({ ctx, ...props }));
  ipcPreloadMain.handle('getOrCreateDevice', (_, props) => getOrCreateDevice({ ctx, ...props }));
  ipcPreloadMain.handle('renameDevice', (_, props) => renameDevice({ ctx, ...props }));
  ipcPreloadMain.handle('addBackup', (_, props) => addBackup({ ctx, ...props }));
  ipcPreloadMain.handle('getItemsByFolderUuid', (_, props) => getItemsByFolderUuid({ ctx, ...props }));
}

export function clearLoggedPreloadIpc() {
  ipcPreloadMain.removeHandler('getUsage');
  ipcPreloadMain.removeHandler('driveChooseSyncRootWithDialog');

  // Backups
  ipcPreloadMain.removeHandler('deleteBackupsFromDevice');
  ipcPreloadMain.removeHandler('backupsSetInterval');
  ipcPreloadMain.removeHandler('backupsStartProcess');
  ipcPreloadMain.removeHandler('downloadBackup');
  ipcPreloadMain.removeHandler('deleteBackupsFromDevice');
  ipcPreloadMain.removeHandler('getDevices');
  ipcPreloadMain.removeHandler('getBackupsFromDevice');
  ipcPreloadMain.removeHandler('getOrCreateDevice');
  ipcPreloadMain.removeHandler('renameDevice');
  ipcPreloadMain.removeHandler('addBackup');
  ipcPreloadMain.removeHandler('getItemsByFolderUuid');
}
