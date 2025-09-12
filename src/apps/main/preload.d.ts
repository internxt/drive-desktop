import { UserAvailableProducts } from '@internxt/drive-desktop-core/build/backend';
import { AuthLoginResponseViewModel } from '../../infra/drive-server/services/auth/auth.types';
import { CleanerReport } from '../../backend/features/cleaner/cleaner.types';

declare interface Window {
  electron: {
    getConfigKey(key: import('./config/service').StoredValues): Promise<any>;

    listenToConfigKeyChange<T>(
      key: import('./config/service').StoredValues,
      fn: (value: T) => void
    ): () => void;

    setConfigKey: typeof import('./config/service').setConfigKey;

    pathChanged(path: string): void;

    getGeneralIssues: () => Promise<
      import('../../shared/issues/AppIssue').AppIssue[]
    >;

    onGeneralIssuesChanged: (
      func: (value: import('../../shared/issues/AppIssue').AppIssue[]) => void
    ) => () => void;

    onSyncStopped: (
      func: (
        value: import('../../context/desktop/sync/domain/SyncStoppedPayload').SyncStoppedPayload
      ) => void
    ) => () => void;

    getVirtualDriveIssues(): Promise<
      import('../../shared/issues/VirtualDriveIssue').VirtualDriveIssue[]
    >;

    onProcessIssuesChanged(
      func: (
        value: import('../../shared/issues/VirtualDriveIssue').VirtualDriveIssue[]
      ) => void
    ): () => void;

    onSyncInfoUpdate(
      func: (value: import('../shared/types').DriveOperationInfo) => void
    ): () => void;

    userIsUnauthorized(): void;

    userLoggedIn(
      data: import('../renderer/pages/Login/service').AccessResponse
    ): void;

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

    getHeaders(
      includeMnemonic?: boolean
    ): Promise<ReturnType<typeof import('./auth/service').getHeaders>>;

    startSyncProcess(): void;

    stopSyncProcess(): void;

    moveSyncFolderToDesktop(): Promise<
      typeof import('../main/migration/service').moveSyncFolderToDesktop
    >;

    openProcessIssuesWindow(): void;

    openLogs(): void;

    sendReport: typeof import('./bug-report/service').sendReport;

    openSettingsWindow(
      section?: 'BACKUPS' | 'GENERAL' | 'ACCOUNT' | 'ANTIVIRUS'
    ): void;

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

    getBackupFatalIssue(
      id: number
    ): Promise<import('../../shared/issues/SyncErrorCause').SyncError>;

    onBackupsStatusChanged(
      func: (
        value: import('./background-processes/backups/BackupsProcessStatus/BackupsStatus').BackupsStatus
      ) => void
    ): () => void;

    onBackupProgress(
      func: (
        value: import('./background-processes/backups/types/BackupsProgress').BackupsProgress
      ) => void
    ): () => void;

    onBackupDownloadProgress(
      func: (value: { id: string; progress: number }) => void
    ): () => void;

    getBackupFatalErrors(): Promise<
      import('../main/background-processes/backups/BackupFatalErrors/BackupFatalErrors').BackupErrorsCollection
    >;

    getVirtualDriveRoot(): Promise<string>;

    chooseSyncRootWithDialog: typeof import('./virtual-root-folder/service').chooseSyncRootWithDialog;

    path: typeof import('path');

    getOrCreateDevice: typeof import('../../backend/features/device/device.module').DeviceModule.getOrCreateDevice;

    renameDevice: typeof import('../../backend/features/device/device.module').DeviceModule.renameDevice;

    devices: {
      getDevices: () => Promise<Array<import('../main/device/service').Device>>;
    };

    onDeviceCreated(
      func: (value: import('../main/device/service').Device) => void
    ): () => void;

    getBackupsFromDevice: typeof import('../../backend/features/device/device.module').DeviceModule.getBackupsFromDevice;

    addBackup: typeof import('../main/device/service').addBackup;

    downloadBackup: typeof import('../main/device/service').downloadBackup;

    abortDownloadBackups: (deviceId: string) => void;

    addBackupsFromLocalPaths: typeof import('../main/device/service').createBackupsFromLocalPaths;

    deleteBackup: typeof import('../main/device/service').deleteBackup;

    deleteBackupsFromDevice: typeof import('../main/device/service').deleteBackupsFromDevice;

    disableBackup: typeof import('../main/device/service').disableBackup;

    getBackupsEnabled: () => Promise<boolean>;

    toggleBackupsEnabled: () => Promise<void>;

    getLastBackupTimestamp: () => Promise<number>;

    getLastBackupExitReason: () => Promise<
      import('../main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker').WorkerExitCause
    >;

    deleteBackupError(folderId: number): Promise<void>;

    onBackupFatalErrorsChanged(
      fn: (
        value: import('../main/background-processes/backups/BackupFatalErrors/BackupFatalErrors').BackupErrorsCollection
      ) => void
    ): () => void;

    changeBackupPath: typeof import('../main/device/service').changeBackupPath;

    getFolderPath: typeof import('../main/device/service').getPathFromDialog;

    onRemoteChanges(
      func: (value: import('../main/realtime').EventPayload) => void
    ): () => void;

    getUsage: () => Promise<
      import('../../backend/features/usage/usage.types').Usage
    >;

    getPlatform: () => Promise<
      import('../main/platform/DesktopPlatform').DesktopPlatform
    >;

    userLogginFailed: (email: string) => void;

    startMigration: () => Promise<void>;
    openMigrationFailedFolder: () => Promise<void>;
    sendFeedback: (feedback: string) => Promise<void>;
    openFeedbackWindow(): void;
    onRemoteSyncStatusChange(
      callback: (
        status: import('./remote-sync/helpers').RemoteSyncStatus
      ) => void
    ): () => void;
    getRemoteSyncStatus(): Promise<
      import('./remote-sync/helpers').RemoteSyncStatus
    >;
    getVirtualDriveStatus(): Promise<
      import('../drive/fuse/FuseDriveStatus').FuseDriveStatus
    >;
    onVirtualDriveStatusChange(
      callback: (event: {
        status: import('../drive/fuse/FuseDriveStatus').FuseDriveStatus;
      }) => void
    ): () => void;
    retryVirtualDriveMount(): Promise<void>;
    startRemoteSync: () => Promise<void>;
    openUrl: (url: string) => Promise<void>;
    getPreferredAppLanguage: () => Promise<Array<string>>;
    user: {
      hasDiscoveredBackups: () => Promise<boolean>;
      discoveredBackups: () => Promise<void>;
    };
    onBackupFailed: (
      callback: (error: { message: string; cause: string }) => void
    ) => () => void;

    antivirus: {
      isAvailable: () => Promise<boolean>;
      isDefenderActive: () => Promise<boolean>;
      scanItems: (
        folderPaths?: { path: string; itemName: string; isDirectory: boolean }[]
      ) => Promise<void>;

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
        }) => void
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
      startCleanup: (viewModel: import('../../backend/features/cleaner/cleaner.types').CleanerViewModel) => Promise<void>;
      stopCleanup: () => Promise<void>;
      onCleanupProgress: (callback: (progressData: import('../../backend/features/cleaner/cleaner.types').CleanupProgress) => void) => () => void;
      getDiskSpace: () => Promise<number>;
    };
  };
}
