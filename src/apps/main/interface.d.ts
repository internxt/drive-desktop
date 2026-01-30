import { BackupInfo } from './../backups/BackupInfo';
import { Usage } from '../../backend/features/usage/usage.types';
import { Result } from './../../context/shared/domain/Result';
import { UserAvailableProducts } from '@internxt/drive-desktop-core/build/backend';
import { Device } from './device/service';
import {
  AuthAccessResponseViewModel,
  AuthLoginResponseViewModel,
  LoginAccessRequest,
} from '../../infra/drive-server/services/auth/auth.types';
import { TLoggerBody } from '@internxt/drive-desktop-core/build/backend';
import { CleanerReport, CleanerViewModel, CleanupProgress } from '../../backend/features/cleaner/cleaner.types';
import { BackupErrorRecord } from '../../backend/features/backup/backup.types';

/** This interface and declare global will replace the preload.d.ts.
 * The thing is that instead of that, we will gradually will be declaring the interface here as we generate tests
 * And we need to mock the electron API.
 * Once we have all the interface declared here, we can replace the preload.d.ts with this file.
 **/

export interface IElectronAPI {
  finishOnboarding: () => void;
  getBackupsInterval(): Promise<number>;

  setBackupsInterval(value: number): Promise<void>;

  getOrCreateDevice: () => Promise<Device | Error>;

  getBackupsFromDevice: (device: Device, isCurrent?: boolean) => Promise<Array<BackupInfo>>;

  addBackup: () => Promise<BackupInfo | undefined>;

  deleteBackupsFromDevice: (device: Device, isCurrent?: boolean) => Promise<void>;

  disableBackup: (backup: BackupInfo) => Promise<void>;

  downloadBackup: (device: Device) => Promise<void>;

  abortDownloadBackups: (deviceId: string) => void;

  renameDevice: (deviceName: string) => Promise<Device>;
  devices: {
    getDevices: () => Promise<Array<Device>>;
  };

  onDeviceCreated: (callback: (device: Device) => void) => () => void;

  openUrl: (url: string) => Promise<void>;

  checkInternetConnection(): Promise<boolean>;

  userAvailableProducts: {
    get: () => Promise<UserAvailableProducts | undefined>;
    subscribe: () => void;
    onUpdate: (callback: (products: UserAvailableProducts) => void) => () => void;
  };
  login(email: string): Promise<AuthLoginResponseViewModel>;
  access(credentials: LoginAccessRequest): Promise<AuthAccessResponseViewModel>;
  logger: {
    debug: (rawBody: TLoggerBody) => void;
    warn: (rawBody: TLoggerBody) => void;
    error: (rawBody: TLoggerBody) => void;
  };
  getUsage(): Promise<Result<Usage, Error>>;
  cleaner: {
    generateReport: (force?: boolean) => Promise<CleanerReport>;
    startCleanup: (viewModel: CleanerViewModel) => Promise<void>;
    stopCleanup: () => Promise<void>;
    onCleanupProgress: (callback: (progressData: CleanupProgress) => void) => () => void;
    getDiskSpace: () => Promise<number>;
  };
  antivirus: {
    isAvailable: () => Promise<boolean>;
    isDefenderActive: () => Promise<boolean>;
    scanItems: (folderPaths?: { path: string; itemName: string; isDirectory: boolean }[]) => Promise<void>;
    scanSystem: () => Promise<void>;
    onScanProgress: (
      callback: (progress: {
        scanId: string;
        currentScanPath: string;
        infectedFiles: string[];
        progress: number;
        totalInfectedFiles: number;
        totalScannedFiles: number;
        done?: boolean;
      }) => void,
    ) => Promise<void>;
    removeScanProgressListener: () => void;
    addItemsToScan: (getFiles?: boolean) => Promise<
      | {
          path: string;
          itemName: string;
          isDirectory: boolean;
        }[]
      | undefined
    >;
    removeInfectedFiles: (infectedFiles: string[]) => Promise<void>;
    cancelScan: () => Promise<void>;
  };
  getBackupErrorByFolder(folderId: number): Promise<BackupErrorRecord | undefined>;
  getLastBackupHadIssues(): Promise<boolean>;
  onBackupFatalErrorsChanged(fn: (backupErrors: Array<BackupErrorRecord>) => void): () => void;
  getBackupFatalErrors(): Promise<Array<BackupErrorRecord>>;
  onBackupProgress(func: (value: number) => void): () => void;
  startRemoteSync(): Promise<void>;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
