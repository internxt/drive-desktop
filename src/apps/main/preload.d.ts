declare interface Window {
  electron: {
    getConfigKey(key: import('./config/service').StoredValues): Promise<any>;

    listenToConfigKeyChange<T>(
      key: import('./config/service').StoredValues,
      fn: (value: T) => void
    ): () => void;

    setConfigKey: typeof import('./config/service').setConfigKey;

    pathChanged(path: string): void;

    logger: {
      info: (...message: unknown[]) => void;
      error: (...message: unknown[]) => void;
      warn: (...message: unknown[]) => void;
      debug: (...message: unknown[]) => void;
    };

    getGeneralIssues: () => Promise<
      import('../../apps/shared/types').GeneralIssue[]
    >;

    onGeneralIssuesChanged: (
      func: (value: import('../../apps/shared/types').GeneralIssue[]) => void
    ) => () => void;

    onSyncStopped: (
      func: (
        value: import('../../context/desktop/sync/domain/SyncStoppedPayload').SyncStoppedPayload
      ) => void
    ) => () => void;

    getProcessIssues(): Promise<import('../shared/types').ProcessIssue[]>;

    onProcessIssuesChanged(
      func: (value: import('../shared/types').ProcessIssue[]) => void
    ): () => void;

    onSyncInfoUpdate(
      func: (value: import('../shared/types').ProcessInfoUpdatePayload) => void
    ): () => void;

    userIsUnauthorized(): void;

    getBackupFatalIssue(
      id: number
    ): Promise<import('../shared/issues/SyncErrorCause').SyncError>;

    getBackupFatalErrors(): Promise<
      import('../main/background-processes/backups/BackupFatalErrors/BackupFatalErrors').BackupErrorsCollection
    >;

    onBackupFatalErrorsChanged(
      fn: (
        value: import('../main/background-processes/backups/BackupFatalErrors/BackupFatalErrors').BackupErrorsCollection
      ) => void
    ): () => void;

    getLastBackupExitReason: () => Promise<
      import('../main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker').WorkerExitCause
    >;

    downloadBackup: typeof import('../main/device/service').downloadBackup;

    userLoggedIn(
      data: import('../renderer/pages/Login/service').AccessResponse
    ): void;

    isUserLoggedIn(): Promise<boolean>;

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

    openSettingsWindow(section?: 'BACKUPS' | 'GENERAL' | 'ACCOUNT'): void;

    settingsWindowResized(payload: { width: number; height: number }): void;

    isAutoLaunchEnabled(): Promise<boolean>;

    toggleAutoLaunch(): Promise<void>;

    toggleDarkMode(mode: 'system' | 'light' | 'dark'): Promise<void>;

    getBackupsInterval(): Promise<number>;

    setBackupsInterval(value: number): Promise<void>;

    getBackupsStatus(): Promise<
      import('./background-processes/backups/BackupsProcessStatus/BackupsStatus').BackupsStatus
    >;

    onBackupProgress(
      func: (
        value: import('./background-processes/backups/types/BackupsProgress').BackupsProgress
      ) => void
    ): () => void;

    onBackupDownloadProgress(
      func: (value: { id: string; progress: number }) => void
    ): () => void;

    abortDownloadBackups: (deviceId: string) => void;

    onBackupsStatusChanged(
      func: (
        value: import('./background-processes/backups/BackupsProcessStatus/BackupsStatus').BackupsStatus
      ) => void
    ): () => void;

    startBackupsProcess(): void;

    stopBackupsProcess(): void;

    getVirtualDriveRoot(): Promise<string>;

    chooseSyncRootWithDialog: typeof import('./virtual-root-folder/service').chooseSyncRootWithDialog;

    path: typeof import('path');

    getOrCreateDevice: typeof import('../main/device/service').getOrCreateDevice;

    renameDevice: typeof import('../main/device/service').renameDevice;

    getBackups: typeof import('../main/device/service').getBackupsFromDevice;

    devices: {
      getDevices: () => Promise<Array<import('../main/device/service').Device>>;
    };

    getBackupsFromDevice: typeof import('../main/device/service').getBackupsFromDevice;

    addBackup: typeof import('../main/device/service').addBackup;

    addBackupsFromLocalPaths: typeof import('../main/device/service').createBackupsFromLocalPaths;

    deleteBackup: typeof import('../main/device/service').deleteBackup;

    disableBackup: typeof import('../main/device/service').disableBackup;

    deleteBackupsFromDevice: typeof import('../main/device/service').deleteBackupsFromDevice;

    getBackupsEnabled: () => Promise<boolean>;

    toggleBackupsEnabled: () => Promise<void>;

    getLastBackupTimestamp: () => Promise<number>;

    deleteBackupError(folderId: number): Promise<void>;

    changeBackupPath: typeof import('../main/device/service').changeBackupPath;

    getFolderPath: typeof import('../main/device/service').getPathFromDialog;

    onRemoteChanges(func: () => void): () => void;

    getUsage: () => Promise<import('./usage/Usage').Usage>;

    getPlatform: () => Promise<
      import('../main/platform/DesktopPlatform').DesktopPlatform
    >;

    userLogginFailed: (email: string) => void;

    startMigration: () => Promise<void>;
    openMigrationFailedFolder: () => Promise<void>;
    sendFeedback: (feedback: string) => Promise<void>;
    onRemoteSyncStatusChange(
      callback: (
        status: import('./remote-sync/helpers').RemoteSyncStatus
      ) => void
    ): () => void;
    getRemoteSyncStatus(): Promise<
      import('./remote-sync/helpers').RemoteSyncStatus
    >;
    getVirtualDriveStatus(): Promise<
      import('../shared/types/VirtualDriveStatus').VirtualDriveStatus
    >;
    onVirtualDriveStatusChange(
      callback: (event: {
        status: import('../shared/types/VirtualDriveStatus').VirtualDriveStatus;
      }) => void
    ): () => void;
    retryVirtualDriveMount(): void;
    startRemoteSync: () => Promise<void>;
    openUrl: (url: string) => Promise<void>;
    getPreferredAppLanguage: () => Promise<Array<string>>;
    syncManually: () => Promise<void>;
    getRecentlywasSyncing: () => Promise<boolean>;
    getUnsycFileInSyncEngine: () => Promise<string[]>;
    updateUnsycFileInSyncEngine: () => Promise<void>;
    getUserSystemPath: () => Promise<
      | {
          path: string;
          itemName: string;
          isDirectory: boolean;
        }
      | undefined
    >;
    user: {
      hasDiscoveredBackups: () => Promise<boolean>;
      discoveredBackups: () => Promise<void>;
    };

    antivirus: {
      // onProgressUpdate: (callback: (data: any) => void) => void;
      // isSystemScanning: () => boolean;
      isAvailable: () => Promise<boolean>;
      isDefenderActive: () => Promise<boolean>;
      scanItems: (
        folderPaths: { path: string; itemName: string; isDirectory: boolean }[]
      ) => Promise<void>;

      scanSystem: (item: {
        path: string;
        itemName: string;
        isDirectory: boolean;
      }) => Promise<void>;

      onScanProgress: (
        callback: (progress: {
          err: string;
          file: string;
          isInfected: boolean;
          viruses: string[];
          countScannedItems: number;
          progressRatio: number;
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
    };
  };
}
