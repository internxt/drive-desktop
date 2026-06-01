import { UserAvailableProducts } from '@internxt/drive-desktop-core/build/backend';
import { AuthLoginResponseViewModel } from '../../infra/drive-server/services/auth/auth.types';
import { CleanerReport } from '../../backend/features/cleaner/cleaner.types';
import { BackupErrorRecord } from '../../backend/features/backup/backup.types';
import type { Device } from '../../backend/features/backup/types/Device';

declare interface Window {
  electron: {
    getConfigKey<T extends import('./config/service.types').StoredValues>(
      key: T,
    ): Promise<import('../../core/electron/store/app-store.interface').AppStore[T]>;

    listenToConfigKeyChange<T>(key: import('./config/service.types').StoredValues, fn: (value: T) => void): () => void;

    setConfigKey: typeof import('./config/service').setConfigKey;

    pathChanged(path: string): void;

    getGeneralIssues: () => Promise<import('../../shared/issues/AppIssue').AppIssue[]>;

    onGeneralIssuesChanged: (func: (value: import('../../shared/issues/AppIssue').AppIssue[]) => void) => () => void;

    onSyncStopped: (
      func: (value: import('../../context/desktop/sync/domain/SyncStoppedPayload').SyncStoppedPayload) => void,
    ) => () => void;

    getVirtualDriveIssues(): Promise<import('../../shared/issues/VirtualDriveIssue').VirtualDriveIssue[]>;

    onProcessIssuesChanged(
      func: (value: import('../../shared/issues/VirtualDriveIssue').VirtualDriveIssue[]) => void,
    ): () => void;

    onSyncInfoUpdate(func: (value: import('../shared/types').DriveOperationInfo) => void): () => void;

    isUserLoggedIn(): Promise<boolean>;

    checkInternetConnection(): Promise<boolean>;

    onUserLoggedInChanged(func: (value: boolean) => void): void;

    logout(): void;

    closeWindow(): void;

    minimizeWindow(): void;

    openVirtualDriveFolder(): Promise<void>;

    finishOnboarding(): void;

    finishMigration(): void;

    openVirtualDrive(): void;

    quit(): void;

    getUser(): Promise<ReturnType<typeof import('./auth/service').getUser>>;

    openProcessIssuesWindow(): void;

    openLogs(): void;

    openSettingsWindow(section?: 'BACKUPS' | 'GENERAL' | 'ACCOUNT' | 'ANTIVIRUS'): void;

    settingsWindowResized(payload: { width: number; height: number }): void;

    isAutoLaunchEnabled(): Promise<boolean>;

    toggleAutoLaunch(): Promise<void>;

    toggleDarkMode(mode: 'system' | 'light' | 'dark'): Promise<void>;

    getBackupsInterval(): Promise<number>;

    setBackupsInterval(value: number): Promise<void>;

    startBackupsProcess(): void;

    stopBackupsProcess(): void;

    getBackupsStatus(): Promise<
      import('./background-processes/backups/BackupsProcessStatus/BackupsStatus').BackupsStatus
    >;

    onBackupsStatusChanged(
      func: (value: import('./background-processes/backups/BackupsProcessStatus/BackupsStatus').BackupsStatus) => void,
    ): () => void;

    onBackupProgress(func: (value: number) => void): () => void;

    onBackupDownloadProgress(func: (value: { id: string; progress: number }) => void): () => void;

    getBackupFatalErrors(): Promise<Array<BackupErrorRecord>>;

    getBackupErrorByFolder(folderId: number): Promise<BackupErrorRecord | undefined>;

    getVirtualDriveRoot(): Promise<string>;

    chooseSyncRootWithDialog: typeof import('./virtual-root-folder/service').chooseSyncRootWithDialog;

    path: typeof import('path');

    getOrCreateDevice: typeof import('../../backend/features/device/device.module').DeviceModule.getOrCreateDevice;

    renameDevice: typeof import('../../backend/features/device/device.module').DeviceModule.renameDevice;

    devices: {
      getDevices: () => Promise<Array<Device>>;
    };

    onDeviceCreated(func: (value: Device) => void): () => void;

    getBackupsFromDevice: typeof import('../../backend/features/device/device.module').DeviceModule.getBackupsFromDevice;

    addBackup: typeof import('../../backend/features/backup/add-backup').addBackup;

    downloadBackup: (
      device: import('../../backend/features/backup/types/Device').Device,
      pathname: import('../../context/local/localFile/infrastructure/AbsolutePath').AbsolutePath,
    ) => Promise<void>;

    abortDownloadBackups: (deviceId: string) => void;

    addBackupsFromLocalPaths: typeof import('../../backend/features/backup/create-backups-from-local-paths').createBackupsFromLocalPaths;

    deleteBackup: typeof import('../../backend/features/backup/delete-backup').deleteBackup;

    deleteBackupsFromDevice: typeof import('../../backend/features/backup/delete-device-backups').deleteDeviceBackups;

    disableBackup: typeof import('../../backend/features/backup/disable-backup').disableBackup;

    getBackupsEnabled: () => Promise<boolean>;

    toggleBackupsEnabled: () => Promise<void>;

    getLastBackupTimestamp: () => Promise<number>;

    getLastBackupHadIssues: () => Promise<boolean>;

    deleteBackupError(folderId: number): Promise<void>;

    onBackupFatalErrorsChanged(fn: (backupErrors: Array<BackupErrorRecord>) => void): () => void;

    changeBackupPath: typeof import('../../backend/features/backup/change-backup-path').changeBackupPath;

    getFolderPath: typeof import('../../core/utils/get-path-from-dialog').getPathFromDialog;

    onRemoteChanges(func: (value: import('../main/realtime').EventPayload) => void): () => void;

    getUsage: () => Promise<import('../../backend/features/usage/usage.types').Usage>;

    onRemoteSyncStatusChange(callback: (status: import('./remote-sync/helpers').RemoteSyncStatus) => void): () => void;
    getRemoteSyncStatus(): Promise<import('./remote-sync/helpers').RemoteSyncStatus>;
    getVirtualDriveStatus(): Promise<import('../drive/fuse/FuseDriveStatus').FuseDriveStatus>;
    onVirtualDriveStatusChange(
      callback: (event: { status: import('../drive/fuse/FuseDriveStatus').FuseDriveStatus }) => void,
    ): () => void;
    startRemoteSync: () => Promise<void>;
    openUrl: (url: string) => Promise<void>;
    getPreferredAppLanguage: () => Promise<Array<string>>;
    user: {
      hasDiscoveredBackups: () => Promise<boolean>;
      discoveredBackups: () => Promise<void>;
    };
    onBackupFailed: (callback: (error: { message: string; cause: string }) => void) => () => void;

    antivirus: {
      isAvailable: () => Promise<boolean>;
      isBackgroundScanEnabled: () => Promise<boolean>;
      setBackgroundScanEnabled: (enabled: boolean) => Promise<boolean>;
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

    userAvailableProducts: {
      get: () => Promise<UserAvailableProducts | undefined>;
      subscribe: () => void;
      onUpdated: (callback: (products: UserAvailableProducts) => void) => void;
    };

    login(email: string): Promise<AuthLoginResponseViewModel>;
    cleaner: {
      generateReport: (force?: boolean) => Promise<CleanerReport>;
      startCleanup: (
        viewModel: import('../../backend/features/cleaner/cleaner.types').CleanerViewModel,
      ) => Promise<void>;
      stopCleanup: () => Promise<void>;
      onCleanupProgress: (
        callback: (progressData: import('../../backend/features/cleaner/cleaner.types').CleanupProgress) => void,
      ) => () => void;
      getDiskSpace: () => Promise<number>;
    };
    getUpdateStatus(): Promise<{ version: string } | null>;
    onUpdateAvailable(callback: (info: { version: string }) => void): () => void;
  };
}
