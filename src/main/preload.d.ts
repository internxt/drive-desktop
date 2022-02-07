declare interface Window {
  electron: {
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

    getProcessIssues(): Promise<import('../workers/types').ProcessIssue[]>;

    onProcessIssuesChanged(
      func: (value: import('../workers/types').ProcessIssue[]) => void
    ): () => void;

    openProcessIssuesWindow(): void;

    openLogs(): void;

    sendReport: typeof import('./bug-report/service').sendReport;

    openSettingsWindow(): void;

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

    deleteBackup: typeof import('../main/device/service').deleteBackup;

    disableBackup: typeof import('../main/device/service').disableBackup;

    getBackupsEnabled: () => Promise<boolean>;

    toggleBackupsEnabled: () => Promise<void>;

    getLastBackupTimestamp: () => Promise<number>;

    getLastBackupExitReason: () => Promise<
      import('../main/background-processes/backups').BackupExitReason | null
    >;
  };
}
