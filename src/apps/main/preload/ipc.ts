/* eslint-disable @typescript-eslint/no-explicit-any */

import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { calculateUsage } from '../usage/service';
import { getLastBackupProgress } from '../background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { getAvailableProducts } from '../payments/get-available-products';
import { CleanerModule } from '@/backend/features/cleaner/cleaner.module';
import { getTheme } from '../theme/theme';

type AsyncMirror<T extends (...args: any[]) => unknown> =
  Parameters<T> extends [] ? () => ReturnType<T> : (props: Parameters<T>[0]) => ReturnType<T>;

type Mirror<T extends (...args: any[]) => unknown> =
  Parameters<T> extends [] ? () => Promise<ReturnType<T>> : (props: Parameters<T>[0]) => Promise<ReturnType<T>>;

export type FromProcess = {
  authAccess: AsyncMirror<typeof driveServerWipModule.auth.access>;
  authLogin: AsyncMirror<typeof driveServerWipModule.auth.login>;
  getLastBackupProgress: Mirror<typeof getLastBackupProgress>;
  getUsage: AsyncMirror<typeof calculateUsage>;
  getAvailableProducts: AsyncMirror<typeof getAvailableProducts>;
  cleanerGenerateReport: AsyncMirror<typeof CleanerModule.generateCleanerReport>;
  cleanerStartCleanup: AsyncMirror<typeof CleanerModule.startCleanup>;
  cleanerStopCleanup: Mirror<typeof CleanerModule.stopCleanup>;
  cleanerGetDiskSpace: AsyncMirror<typeof CleanerModule.getDiskSpace>;
  getTheme: Mirror<typeof getTheme>;
};

export type FromMain = {};
