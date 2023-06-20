declare interface Window {
  electron: {
    query: typeof import('./app-info/service').executeQuery;
    getConfigKey(key: import('./config/service').StoredValues): Promise<any>;
    listenToConfigKeyChange<T>(
      key: import('./config/service').StoredValues,
      fn: (value: T) => void
    ): () => void;
    setConfigKey: typeof import('./config/service').setConfigKey;
    pathChanged(path: string): void;
    userIsUnauthorized(): void;
    userLoggedIn(
      data: import('../renderer/pages/Login/service').AccessResponse
    ): void;

    isUserLoggedIn(): Promise<boolean>;

    onUserLoggedInChanged(func: (value: boolean) => void): void;

    logout(): void;

    closeWindow(): void;

    openSyncFolder(): Promise<void>;

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

    getSyncStatus(): Promise<
      import('main/background-processes/sync').SyncStatus
    >;

    onSyncStatusChanged(
      func: (value: import('main/background-processes/sync').SyncStatus) => void
    ): () => void;

    onSyncStopped(
      func: (
        value: import('main/background-processes/sync').SyncStoppedPayload
      ) => void
    ): () => void;

    onSyncInfoUpdate(
      func: (value: import('../workers/types').ProcessInfoUpdatePayload) => void
    ): () => void;

    moveSyncFolderToDesktop(): Promise<
      typeof import('../main/migration/service').moveSyncFolderToDesktop
    >;
    getProcessIssues(): Promise<import('../workers/types').ProcessIssue[]>;

    onProcessIssuesChanged(
      func: (value: import('../workers/types').ProcessIssue[]) => void
    ): () => void;

    getGeneralIssues(): Promise<import('../workers/types').GeneralIssue[]>;

    onGeneralIssuesChanged(
      func: (value: import('../workers/types').GeneralIssue[]) => void
    ): () => void;

    openProcessIssuesWindow(): void;

    openLogs(): void;

    sendReport: typeof import('./bug-report/service').sendReport;

    openSettingsWindow(section?: 'BACKUPS' | 'GENERAL' | 'ACCOUNT'): void;

    settingsWindowResized(payload: { width: number; height: number }): void;

    isAutoLaunchEnabled(): Promise<boolean>;

    toggleAutoLaunch(): Promise<void>;

    getBackupsInterval(): Promise<number>;

    setBackupsInterval(value: number): Promise<void>;

    startBackupsProcess(): void;

    stopBackupsProcess(): void;

    getBackupsStatus(): Promise<
      import('main/background-processes/backups').BackupsStatus
    >;

    onBackupsStatusChanged(
      func: (
        value: import('main/background-processes/backups').BackupsStatus
      ) => void
    ): () => void;

    getSyncRoot(): Promise<string>;

    chooseSyncRootWithDialog: typeof import('./sync-root-folder/service').chooseSyncRootWithDialog;

    path: typeof import('path');

    getOrCreateDevice: typeof import('../main/device/service').getOrCreateDevice;

    renameDevice: typeof import('../main/device/service').renameDevice;

    getBackups: typeof import('../main/device/service').getBackupsFromDevice;

    addBackup: typeof import('../main/device/service').addBackup;
    addBackupsFromLocalPaths: typeof import('../main/device/service').createBackupsFromLocalPaths;
    deleteBackup: typeof import('../main/device/service').deleteBackup;

    disableBackup: typeof import('../main/device/service').disableBackup;

    getBackupsEnabled: () => Promise<boolean>;

    toggleBackupsEnabled: () => Promise<void>;

    getLastBackupTimestamp: () => Promise<number>;

    getLastBackupExitReason: () => Promise<
      import('../main/background-processes/backups').BackupExitReason | null
    >;

    onBackupProgress(
      func: (
        value: import('main/background-processes/backups').BackupProgress
      ) => void
    ): () => void;
    onBackupProgress(
      func: (
        value: import('main/background-processes/backups').BackupProgress
      ) => void
    ): () => void;

    getBackupFatalErrors(): Promise<
      Array<
        import('../main/background-processes/types/BackupFatalError').BackupFatalError
      >
    >;

    onBackupFatalErrorsChanged(
      func: (
        value: Array<
          import('../main/background-processes/types/BackupFatalError').BackupFatalError
        >
      ) => void
    ): () => void;

    changeBackupPath: typeof import('../main/device/service').changeBackupPath;
    getFolderPath: typeof import('../main/device/service').getPathFromDialog;
    onRemoteChanges(func: () => void): () => void;

    getUsage: () => Promise<import('../main/usage/usage').Usage>;

    getPlatform: () => Promise<
      import('../main/platform/DesktopPlatform').DesktopPlatform
    >;

    userLogginFailed: (email: string) => void;

    startMigration: () => Promise<void>;
    openMigrationFailedFolder: () => Promise<void>;
    sendFeedback: (feedback: string) => Promise<void>;
    openFeedbackWindow(): void;

    // DEV
    resizeWindow: () => typeof import('../main/dev/service').resizeCurrentWindow;
  };
}
