declare interface Window {
  electron: {
    query: typeof import('./app-info/service').executeQuery;
    electron: {
      query: typeof import('./app-info/service').executeQuery;

      getConfigKey(key: import('./config/service').StoredValues): Promise<any>;
      getConfigKey(key: import('./config/service').StoredValues): Promise<any>;

      listenToConfigKeyChange<T>(
        key: import('./config/service').StoredValues,
        fn: (value: T) => void
      ): () => void;
      listenToConfigKeyChange<T>(
        key: import('./config/service').StoredValues,
        fn: (value: T) => void
      ): () => void;

      setConfigKey: typeof import('./config/service').setConfigKey;

      pathChanged(path: string): void;
      pathChanged(path: string): void;

      userIsUnauthorized(): void;
      userIsUnauthorized(): void;

      userLoggedIn(
        data: import('../renderer/pages/Login/service').AccessResponse
      ): void;
      userLoggedIn(
        data: import('../renderer/pages/Login/service').AccessResponse
      ): void;

      isUserLoggedIn(): Promise<boolean>;
      isUserLoggedIn(): Promise<boolean>;

      onUserLoggedInChanged(func: (value: boolean) => void): void;
      onUserLoggedInChanged(func: (value: boolean) => void): void;

      logout(): void;
      logout(): void;

      closeWindow(): void;
      closeWindow(): void;

      openSyncFolder(): Promise<void>;
      openSyncFolder(): Promise<void>;

      finishOnboarding(): void;
      finishOnboarding(): void;

      quit(): void;
      quit(): void;

      getUser(): Promise<ReturnType<typeof import('./auth/service').getUser>>;
      getUser(): Promise<ReturnType<typeof import('./auth/service').getUser>>;

      getHeaders(
        includeMnemonic?: boolean
      ): Promise<ReturnType<typeof import('./auth/service').getHeaders>>;
      getHeaders(
        includeMnemonic?: boolean
      ): Promise<ReturnType<typeof import('./auth/service').getHeaders>>;

      startSyncProcess(): void;
      startSyncProcess(): void;

      stopSyncProcess(): void;
      stopSyncProcess(): void;

      getSyncStatus(): Promise<
        import('main/background-processes/sync').SyncStatus
      >;
      getSyncStatus(): Promise<
        import('main/background-processes/sync').SyncStatus
      >;

      onSyncStatusChanged(
        func: (
          value: import('main/background-processes/sync').SyncStatus
        ) => void
      ): () => void;
      onSyncStatusChanged(
        func: (
          value: import('main/background-processes/sync').SyncStatus
        ) => void
      ): () => void;

      onSyncStopped(
        func: (
          value: import('main/background-processes/sync').SyncStoppedPayload
        ) => void
      ): () => void;
      onSyncStopped(
        func: (
          value: import('main/background-processes/sync').SyncStoppedPayload
        ) => void
      ): () => void;

      onSyncInfoUpdate(
        func: (
          value: import('../workers/types').ProcessInfoUpdatePayload
        ) => void
      ): () => void;
      onSyncInfoUpdate(
        func: (
          value: import('../workers/types').ProcessInfoUpdatePayload
        ) => void
      ): () => void;

      getProcessIssues(): Promise<import('../workers/types').ProcessIssue[]>;
      getProcessIssues(): Promise<import('../workers/types').ProcessIssue[]>;

      onProcessIssuesChanged(
        func: (value: import('../workers/types').ProcessIssue[]) => void
      ): () => void;
      onProcessIssuesChanged(
        func: (value: import('../workers/types').ProcessIssue[]) => void
      ): () => void;

      getGeneralIssues(): Promise<import('../workers/types').GeneralIssue[]>;
      getGeneralIssues(): Promise<import('../workers/types').GeneralIssue[]>;

      onGeneralIssuesChanged(
        func: (value: import('../workers/types').GeneralIssue[]) => void
      ): () => void;
      onGeneralIssuesChanged(
        func: (value: import('../workers/types').GeneralIssue[]) => void
      ): () => void;

      openProcessIssuesWindow(): void;
      openProcessIssuesWindow(): void;

      openLogs(): void;
      openLogs(): void;

      sendReport: typeof import('./bug-report/service').sendReport;

      openSettingsWindow(section?: 'BACKUPS' | 'GENERAL' | 'ACCOUNT'): void;
      openSettingsWindow(section?: 'BACKUPS' | 'GENERAL' | 'ACCOUNT'): void;

      settingsWindowResized(payload: { width: number; height: number }): void;
      settingsWindowResized(payload: { width: number; height: number }): void;

      isAutoLaunchEnabled(): Promise<boolean>;
      isAutoLaunchEnabled(): Promise<boolean>;

      toggleAutoLaunch(): Promise<void>;
      toggleAutoLaunch(): Promise<void>;

      getBackupsInterval(): Promise<number>;
      getBackupsInterval(): Promise<number>;

      setBackupsInterval(value: number): Promise<void>;
      setBackupsInterval(value: number): Promise<void>;

      startBackupsProcess(): void;
      startBackupsProcess(): void;

      stopBackupsProcess(): void;
      stopBackupsProcess(): void;

      getBackupsStatus(): Promise<
        import('main/background-processes/backups').BackupsStatus
      >;
      getBackupsStatus(): Promise<
        import('main/background-processes/backups').BackupsStatus
      >;

      onBackupsStatusChanged(
        func: (
          value: import('main/background-processes/backups').BackupsStatus
        ) => void
      ): () => void;
      onBackupsStatusChanged(
        func: (
          value: import('main/background-processes/backups').BackupsStatus
        ) => void
      ): () => void;

      getSyncRoot(): Promise<string>;
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

      // DEV
      // DEV

      resizeWindow: () => typeof import('../main/dev/service').resizeCurrentWindow;
    };
    resizeWindow: () => typeof import('../main/dev/service').resizeCurrentWindow;
  };
}
