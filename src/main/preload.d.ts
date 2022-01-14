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

    getUser(): Promise<import('./types').User>;

    getHeaders(): Promise<ReturnType<typeof import('./auth').getHeaders>>;

    startSyncProcess(): void;

    stopSyncProcess(): void;

    getSyncStatus(): Promise<import('main/main').SyncStatus>;

    onSyncStatusChanged(
      func: (value: import('main/main').SyncStatus) => void
    ): void;

    onSyncStopped(
      func: (value: import('main/main').SyncStoppedPayload) => void
    ): void;

    onSyncInfoUpdate(
      func: (value: import('../workers/sync').SyncInfoUpdatePayload) => void
    ): void;

    getSyncIssues(): Promise<import('../workers/sync').SyncInfoUpdatePayload[]>;

    onSyncIssuesChanged(
      func: (value: import('../workers/sync').SyncInfoUpdatePayload[]) => void
    ): void;

    env: typeof process.env;
  };
}
