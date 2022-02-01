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

    getHeaders(): Promise<
      ReturnType<typeof import('./auth/service').getHeaders>
    >;

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
      func: (value: import('../workers/sync').SyncInfoUpdatePayload) => void
    ): () => void;

    getSyncIssues(): Promise<import('../workers/sync').SyncIssue[]>;

    onSyncIssuesChanged(
      func: (value: import('../workers/sync').SyncIssue[]) => void
    ): () => void;

    openSyncIssuesWindow(): void;

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
  };
}
