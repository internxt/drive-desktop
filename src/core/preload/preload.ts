import { contextBridge, ipcRenderer } from 'electron';
import path from 'path';
import Logger from 'electron-log';
import { inspect } from 'util';
import { StoredValues } from '@/apps/main/config/service';
import { TRawBody } from '@/apps/shared/logger/logger';
import { AccessResponse } from '@/apps/renderer/pages/Login/service';
import { AuthService } from '@/context/infra/api/auth.service';

contextBridge.exposeInMainWorld('electron', {
  getConfigKey(key: StoredValues) {
    return ipcRenderer.invoke('get-config-key', key);
  },
  setConfigKey(key: any, value: any) {
    return ipcRenderer.send('set-config-key', { key, value });
  },
  listenToConfigKeyChange<T>(key: StoredValues, fn: (value: T) => void) {
    const eventName = `${key}-updated`;
    const callback = (_: any, v: any) => fn(v);
    ipcRenderer.on(eventName, (_, v) => fn(v));
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  isDarkModeActive() {
    return ipcRenderer.invoke('is-dark-mode-active');
  },
  logger: {
    info: (rawBody: TRawBody) => Logger.info(inspect(rawBody, { colors: true, depth: Infinity, breakLength: Infinity })),
    error: (rawBody: TRawBody) => Logger.error(inspect(rawBody, { colors: true, depth: Infinity, breakLength: Infinity })),
    warn: (rawBody: TRawBody) => Logger.warn(inspect(rawBody, { colors: true, depth: Infinity, breakLength: Infinity })),
    debug: (rawBody: TRawBody) => Logger.debug(inspect(rawBody, { colors: true, depth: Infinity, breakLength: Infinity })),
  },
  pathChanged(pathname: string) {
    ipcRenderer.send('path-changed', pathname);
  },
  userIsUnauthorized() {
    ipcRenderer.send('USER_IS_UNAUTHORIZED');
  },
  userLoggedIn(data: AccessResponse) {
    return ipcRenderer.send('user-logged-in', data);
  },
  isUserLoggedIn() {
    return ipcRenderer.invoke('is-user-logged-in');
  },
  onUserLoggedInChanged(func: (value: boolean) => void) {
    return ipcRenderer.on('user-logged-in-changed', (_, v) => func(v));
  },
  userLogginFailed(email: string) {
    ipcRenderer.send('USER_LOGIN_FAILED', email);
  },
  logout() {
    return ipcRenderer.send('user-logged-out');
  },
  closeWindow() {
    return ipcRenderer.send('user-closed-window');
  },
  minimizeWindow() {
    return ipcRenderer.send('user-minimized-window');
  },
  openVirtualDriveFolder() {
    return ipcRenderer.invoke('open-virtual-drive-folder');
  },
  quit() {
    return ipcRenderer.send('user-quit');
  },
  getUser() {
    return ipcRenderer.invoke('get-user');
  },
  getHeaders(includeMnemonic = false) {
    return ipcRenderer.invoke('get-headers', includeMnemonic);
  },
  startSyncProcess() {
    return ipcRenderer.send('start-sync-process');
  },
  stopSyncProcess() {
    return ipcRenderer.send('stop-sync-process');
  },
  getSyncStatus() {
    return ipcRenderer.invoke('get-sync-status');
  },
  onSyncStatusChanged(func: any) {
    const eventName = 'sync-status-changed';
    const callback = (_: any, v: any) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  onSyncStopped(func: any) {
    const eventName = 'sync-stopped';
    const callback = (_: any, v: any) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  onSyncInfoUpdate(func: any) {
    const eventName = 'sync-info-update';
    const callback = (_: any, v: any) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  getGeneralIssues() {
    return ipcRenderer.invoke('get-general-issues');
  },
  onGeneralIssuesChanged(func: any) {
    const eventName = 'general-issues-changed';
    const callback = (_: any, v: any) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  getProcessIssues() {
    return ipcRenderer.invoke('get-process-issues');
  },
  onProcessIssuesChanged(func: any) {
    const eventName = 'process-issues-changed';
    const callback = (_: any, v: any) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  openProcessIssuesWindow() {
    return ipcRenderer.send('open-process-issues-window');
  },
  openLogs() {
    return ipcRenderer.send('open-logs');
  },
  sendReport(report: any) {
    return ipcRenderer.invoke('send-report', report);
  },
  openSettingsWindow(section: any) {
    return ipcRenderer.send('open-settings-window', section);
  },
  settingsWindowResized(payload: any) {
    return ipcRenderer.send('settings-window-resized', payload);
  },
  finishOnboarding() {
    return ipcRenderer.send('user-finished-onboarding');
  },
  finishMigration() {
    return ipcRenderer.send('user-finished-migration');
  },
  isAutoLaunchEnabled() {
    return ipcRenderer.invoke('is-auto-launch-enabled');
  },
  toggleAutoLaunch() {
    return ipcRenderer.invoke('toggle-auto-launch');
  },
  toggleDarkMode(mode: any) {
    if (mode === 'light') {
      return ipcRenderer.invoke('dark-mode:light');
    } else if (mode === 'dark') {
      return ipcRenderer.invoke('dark-mode:dark');
    } else {
      return ipcRenderer.invoke('dark-mode:system');
    }
  },
  getBackupsInterval() {
    return ipcRenderer.invoke('get-backups-interval');
  },
  setBackupsInterval(value: any) {
    return ipcRenderer.invoke('set-backups-interval', value);
  },
  startBackupsProcess() {
    return ipcRenderer.send('start-backups-process');
  },
  stopBackupsProcess() {
    return ipcRenderer.send('stop-backups-process');
  },
  getBackupsStatus() {
    return ipcRenderer.invoke('get-backups-status');
  },
  openVirtualDrive() {
    return ipcRenderer.invoke('open-virtual-drive');
  },
  moveSyncFolderToDesktop() {
    return ipcRenderer.invoke('move-sync-folder-to-desktop');
  },
  // Open the folder where we store the items
  // that we failed to migrate
  openMigrationFailedFolder() {
    return ipcRenderer.invoke('open-migration-failed-folder');
  },
  onBackupsStatusChanged(func: any) {
    const eventName = 'backups-status-changed';
    const callback = (_: any, v: any) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  getVirtualDriveRoot() {
    return ipcRenderer.invoke('get-virtual-drive-root');
  },
  chooseSyncRootWithDialog() {
    return ipcRenderer.invoke('choose-sync-root-with-dialog');
  },
  getOrCreateDevice() {
    return ipcRenderer.invoke('get-or-create-device');
  },
  renameDevice(deviceName: any) {
    return ipcRenderer.invoke('rename-device', deviceName);
  },
  getBackups() {
    return ipcRenderer.invoke('get-backups');
  },
  getBackupFatalIssue(id: any) {
    return ipcRenderer.invoke('backups.get-backup-issues', id);
  },
  clearBackupFatalIssue(id: any) {
    return ipcRenderer.send('backups.clear-backup-issues', id);
  },
  devices: {
    getDevices: () => {
      return ipcRenderer.invoke('devices.get-all');
    },
  },
  getBackupsFromDevice(device: any, isCurrent: any) {
    return ipcRenderer.invoke('get-backups-from-device', device, isCurrent);
  },
  addBackup() {
    return ipcRenderer.invoke('add-backup');
  },
  addBackupsFromLocalPaths(localPaths: any) {
    return ipcRenderer.invoke('add-multiple-backups', localPaths);
  },
  deleteBackup(backup: any) {
    return ipcRenderer.invoke('delete-backup', backup);
  },
  deleteBackupsFromDevice(device: any, isCurrent: any) {
    return ipcRenderer.invoke('delete-backups-from-device', device, isCurrent);
  },
  disableBackup(backup: any) {
    return ipcRenderer.invoke('disable-backup', backup);
  },
  getBackupsEnabled() {
    return ipcRenderer.invoke('get-backups-enabled');
  },
  toggleBackupsEnabled() {
    return ipcRenderer.invoke('toggle-backups-enabled');
  },
  getLastBackupTimestamp() {
    return ipcRenderer.invoke('get-last-backup-timestamp');
  },
  getLastBackupProgress() {
    return ipcRenderer.send('backups.get-last-progress');
  },
  onBackupProgress(func: any) {
    const eventName = 'backup-progress';
    const callback = (_: any, v: any) => func(v);
    ipcRenderer.on(eventName, callback);

    return () => ipcRenderer.removeListener(eventName, callback);
  },
  onBackupDownloadProgress(func: any) {
    const eventName = 'backup-download-progress';
    const callback = (_: any, v: any) => func(v);
    ipcRenderer.on(eventName, callback);

    return () => ipcRenderer.removeListener(eventName, callback);
  },
  abortDownloadBackups(deviceUuid: any) {
    return ipcRenderer.send('abort-download-backups-' + deviceUuid, deviceUuid);
  },
  getBackupFatalErrors() {
    return ipcRenderer.invoke('get-backup-fatal-errors');
  },
  getItemByFolderId(folderId: any) {
    return ipcRenderer.invoke('get-item-by-folder-id', folderId);
  },

  deleteBackupError(folderId: any) {
    return ipcRenderer.invoke('delete-backup-error', folderId);
  },
  onBackupFatalErrorsChanged(func: any) {
    const eventName = 'backup-fatal-errors-changed';
    const callback = (_: any, v: any) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  getLastBackupExitReason() {
    return ipcRenderer.invoke('get-last-backup-exit-reason');
  },
  downloadBackup(backup: any, folderUuids: any) {
    return ipcRenderer.invoke('download-backup', backup, folderUuids);
  },
  changeBackupPath(currentPath: any) {
    return ipcRenderer.invoke('change-backup-path', currentPath);
  },
  getFolderPath() {
    return ipcRenderer.invoke('get-folder-path');
  },
  onRemoteChanges(func: any) {
    const eventName = 'remote-changes';
    const callback = () => func();
    ipcRenderer.on(eventName, callback);

    return () => ipcRenderer.removeListener(eventName, callback);
  },
  startMigration() {
    return ipcRenderer.invoke('open-migration-window');
  },
  getUsage() {
    return ipcRenderer.invoke('get-usage');
  },
  getPlatform() {
    return ipcRenderer.invoke('get-platform');
  },
  resizeWindow(dimensions: any) {
    return ipcRenderer.invoke('resize-focused-window', dimensions);
  },
  addFakeIssues(errorsName: any, process: any) {
    return ipcRenderer.invoke('add-fake-sync-issues', { errorsName, process });
  },
  onRemoteSyncStatusChange(callback: any) {
    const eventName = 'remote-sync-status-change';
    const callbackWrapper = (_: any, v: any) => {
      callback(v);
    };
    ipcRenderer.on(eventName, callbackWrapper);

    return () => ipcRenderer.removeListener(eventName, callbackWrapper);
  },
  getRemoteSyncStatus() {
    return ipcRenderer.invoke('get-remote-sync-status');
  },
  startRemoteSync() {
    return ipcRenderer.invoke('START_REMOTE_SYNC');
  },
  getVirtualDriveStatus() {
    return ipcRenderer.invoke('get-virtual-drive-status');
  },
  retryVirtualDriveMount() {
    return ipcRenderer.invoke('retry-virtual-drive-mount');
  },
  onVirtualDriveStatusChange(callback: any) {
    const eventName = 'virtual-drive-status-change';
    const callbackWrapper = (_: any, v: any) => {
      callback(v);
    };
    ipcRenderer.on(eventName, callbackWrapper);

    return () => ipcRenderer.removeListener(eventName, callbackWrapper);
  },
  openUrl: (url: string) => {
    ipcRenderer.invoke('open-url', url);
  },
  getPreferredAppLanguage() {
    return ipcRenderer.invoke('APP:PREFERRED_LANGUAGE');
  },
  syncManually() {
    return ipcRenderer.invoke('SYNC_MANUALLY');
  },
  getUnsycFileInSyncEngine() {
    return ipcRenderer.invoke('GET_UNSYNC_FILE_IN_SYNC_ENGINE');
  },
  updateUnsycFileInSyncEngine() {
    return ipcRenderer.invoke('SEND_UPDATE_UNSYNC_FILE_IN_SYNC_ENGINE');
  },
  getRecentlywasSyncing() {
    const FIVE_SECONDS = 5000;
    return ipcRenderer.invoke('CHECK_SYNC_IN_PROGRESS', FIVE_SECONDS);
  },
  user: {
    hasDiscoveredBackups() {
      return ipcRenderer.invoke('user.get-has-discovered-backups');
    },
    discoveredBackups() {
      ipcRenderer.send('user.set-has-discovered-backups');
    },
  },
  listenersRefreshBackups(callback: (data: any) => void, eventName = 'refresh-backup') {
    const callbackWrapper = (_: any, data: any) => {
      Logger.info('Refresh backups');
      callback(data);
    };

    ipcRenderer.on(eventName, callbackWrapper);

    return () => ipcRenderer.removeListener(eventName, callbackWrapper);
  },
  backups: {
    isAvailable: () => {
      return ipcRenderer.invoke('backups:is-available');
    },
  },
  antivirus: {
    isAvailable: () => {
      return ipcRenderer.invoke('antivirus:is-available');
    },
    isDefenderActive: () => {
      return ipcRenderer.invoke('antivirus:is-Defender-active');
    },
    scanItems: (folderPaths?: Array<{ path: string; itemName: string; isDirectory: boolean }>) => {
      return ipcRenderer.invoke('antivirus:scan-items', folderPaths);
    },
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
    ) => {
      ipcRenderer.on('antivirus:scan-progress', (_, progress) => callback(progress));
    },
    removeScanProgressListener: () => {
      ipcRenderer.removeAllListeners('antivirus:scan-progress');
    },
    scanSystem: (systemPath: any) => {
      return ipcRenderer.invoke('antivirus:scan-system', systemPath);
    },
    addItemsToScan: (getFiles?: boolean) => {
      return ipcRenderer.invoke('antivirus:add-items-to-scan', getFiles);
    },
    removeInfectedFiles: (infectedFiles: string[]) => {
      return ipcRenderer.invoke('antivirus:remove-infected-files', infectedFiles);
    },
    cancelScan: () => {
      return ipcRenderer.invoke('antivirus:cancel-scan');
    },
  },
  authService: {
    access: (props: Parameters<(typeof AuthService)['access']>[0]) => {
      return ipcRenderer.invoke('renderer.login-access', props);
    },
    login: (props: Parameters<(typeof AuthService)['login']>[0]) => {
      return ipcRenderer.invoke('renderer.login', props);
    },
  },
  path,
});
