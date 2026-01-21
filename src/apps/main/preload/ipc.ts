/* eslint-disable @typescript-eslint/no-explicit-any */

import { calculateUsage } from '../usage/service';
import { getLastBackupProgress } from '../background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { getAvailableProducts } from '../payments/get-available-products';
import { CleanerModule } from '@/backend/features/cleaner/cleaner.module';
import { getTheme } from '../config/theme';
import { LoggerModule } from '@/apps/shared/logger/logger.module';
import { setConfigKey } from '../config/service';
import { getLanguage } from '../config/language';
import { chooseSyncRootWithDialog, getRootVirtualDrive, openVirtualDriveRootFolder } from '../virtual-root-folder/service';
import { downloadBackup } from '@/backend/features/backups/download/download-backup';
import { openLoginUrl } from '../auth/open-login-url';
import { deleteBackupsFromDevice } from '../device/service';
import { getSyncStatus } from '../remote-sync/services/broadcast-sync-status';
import { updateAllRemoteSync } from '../remote-sync/handlers';
import { backupsSetInterval, backupsStartProcess } from '../background-processes/backups/setUpBackups';

type OmitCtx<T> = 'ctx' extends keyof T ? Omit<T, 'ctx'> : T;
type BuildSignature<T extends (...args: any[]) => unknown, R> =
  Parameters<T> extends [] ? () => R : (props: OmitCtx<Parameters<T>[0]>) => R;
type AsyncMirror<T extends (...args: any[]) => unknown> = BuildSignature<T, ReturnType<T>>;
type Mirror<T extends (...args: any[]) => unknown> = BuildSignature<T, Promise<ReturnType<T>>>;

export type FromProcess = {
  getLastBackupProgress: Mirror<typeof getLastBackupProgress>;
  getUsage: AsyncMirror<typeof calculateUsage>;
  getAvailableProducts: AsyncMirror<typeof getAvailableProducts>;
  cleanerGenerateReport: AsyncMirror<typeof CleanerModule.generateCleanerReport>;
  cleanerStartCleanup: AsyncMirror<typeof CleanerModule.startCleanup>;
  cleanerStopCleanup: Mirror<typeof CleanerModule.stopCleanup>;
  cleanerGetDiskSpace: AsyncMirror<typeof CleanerModule.getDiskSpace>;
  getTheme: Mirror<typeof getTheme>;
  openLogs: AsyncMirror<typeof LoggerModule.openLogs>;
  getLanguage: Mirror<typeof getLanguage>;
  setConfigKey: Mirror<typeof setConfigKey>;
  driveGetSyncRoot: AsyncMirror<typeof getRootVirtualDrive>;
  driveChooseSyncRootWithDialog: AsyncMirror<typeof chooseSyncRootWithDialog>;
  driveOpenSyncRootFolder: AsyncMirror<typeof openVirtualDriveRootFolder>;
  downloadBackup: AsyncMirror<typeof downloadBackup>;
  openLoginUrl: Mirror<typeof openLoginUrl>;
  getRemoteSyncStatus: Mirror<typeof getSyncStatus>;
  syncManually: AsyncMirror<typeof updateAllRemoteSync>;

  deleteBackupsFromDevice: AsyncMirror<typeof deleteBackupsFromDevice>;
  backupsStartProcess: AsyncMirror<typeof backupsStartProcess>;
  backupsSetInterval: Mirror<typeof backupsSetInterval>;
};

export type FromMain = {};
