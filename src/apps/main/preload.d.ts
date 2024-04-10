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

    startBackupsProcess(): void;

    stopBackupsProcess(): void;

    getVirtualDriveRoot(): Promise<string>;

    chooseSyncRootWithDialog: typeof import('./virtual-root-folder/service').chooseSyncRootWithDialog;

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
      import('../fuse/FuseDriveStatus').FuseDriveStatus
    >;
    onVirtualDriveStatusChange(
      callback: (event: {
        status: import('../fuse/FuseDriveStatus').FuseDriveStatus;
      }) => void
    ): () => void;
    retryVirtualDriveMount(): Promise<void>;
    startRemoteSync: () => Promise<void>;
    openUrl: (url: string) => Promise<void>;
    getPreferredAppLanguage: () => Promise<Array<string>>;
  };
}
