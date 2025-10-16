import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { calculateUsage } from '../usage/service';
import { getLastBackupProgress } from '../background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { getAvailableProducts } from '../payments/get-available-products';
import { CleanerModule } from '@/backend/features/cleaner/cleaner.module';
import { getSystemTheme } from '../system-theme/system-theme';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mirror<T extends (...args: any[]) => unknown> =
  Parameters<T> extends [] ? () => ReturnType<T> : (props: Parameters<T>[0]) => ReturnType<T>;

export type FromProcess = {
  authAccess: Mirror<typeof driveServerWipModule.auth.access>;
  authLogin: Mirror<typeof driveServerWipModule.auth.login>;
  getLastBackupProgress: Mirror<typeof getLastBackupProgress>;
  getUsage: Mirror<typeof calculateUsage>;
  getAvailableProducts: Mirror<typeof getAvailableProducts>;
  cleanerGenerateReport: Mirror<typeof CleanerModule.generateCleanerReport>;
  cleanerStartCleanup: Mirror<typeof CleanerModule.startCleanup>;
  cleanerStopCleanup: Mirror<typeof CleanerModule.stopCleanup>;
  cleanerGetDiskSpace: Mirror<typeof CleanerModule.getDiskSpace>;
  getSystemTheme: Mirror<typeof getSystemTheme>;
};

export type FromMain = {};
