const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const Logger = require('electron-log');
const { inspect } = require('util');

contextBridge.exposeInMainWorld('electron', {
  getConfigKey(key) {
    return ipcRenderer.invoke('get-config-key', key);
  },
  setConfigKey(props) {
    return ipcRenderer.send('set-config-key', props);
  },
  listenToConfigKeyChange(key, fn) {
    const eventName = `${key}-updated`;
    const callback = (_, v) => fn(v);
    ipcRenderer.on(eventName, (_, v) => fn(v));

    return () => ipcRenderer.removeListener(eventName, callback);
  },

  isDarkModeActive() {
    return ipcRenderer.invoke('is-dark-mode-active');
  },

  logger: {
    info: (rawBody) => Logger.debug(inspect(rawBody, { colors: true, depth: Infinity, breakLength: Infinity })),
    error: (rawBody) => Logger.info(inspect(rawBody, { colors: true, depth: Infinity, breakLength: Infinity })),
    warn: (rawBody) => Logger.debug(inspect(rawBody, { colors: true, depth: Infinity, breakLength: Infinity })),
    debug: (rawBody) => Logger.debug(inspect(rawBody, { colors: true, depth: Infinity, breakLength: Infinity })),
  },

  pathChanged(pathname) {
    ipcRenderer.send('path-changed', pathname);
  },
  userLoggedIn(data) {
    return ipcRenderer.send('user-logged-in', data);
  },
  isUserLoggedIn() {
    return ipcRenderer.invoke('is-user-logged-in');
  },
  onUserLoggedInChanged(func) {
    return ipcRenderer.on('user-logged-in-changed', (_, v) => func(v));
  },
  userLogginFailed(email) {
    ipcRenderer.send('USER_LOGIN_FAILED', email);
  },
  logout() {
    return ipcRenderer.send('USER_LOGGED_OUT');
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
  startSyncProcess() {
    return ipcRenderer.send('start-sync-process');
  },
  stopSyncProcess() {
    return ipcRenderer.send('stop-sync-process');
  },
  getSyncStatus() {
    return ipcRenderer.invoke('get-sync-status');
  },
  onSyncStatusChanged(func) {
    const eventName = 'sync-status-changed';
    const callback = (_, v) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  onSyncStopped(func) {
    const eventName = 'sync-stopped';
    const callback = (_, v) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  onSyncInfoUpdate(func) {
    const eventName = 'sync-info-update';
    const callback = (_, v) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  getIssues() {
    return ipcRenderer.invoke('get-issues');
  },
  onIssuesChanged(func) {
    const eventName = 'issues-changed';
    const callback = (_, v) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  openProcessIssuesWindow() {
    return ipcRenderer.send('open-process-issues-window');
  },
  openLogs() {
    return ipcRenderer.send('open-logs');
  },
  openSettingsWindow(section) {
    return ipcRenderer.send('open-settings-window', section);
  },
  settingsWindowResized(payload) {
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
  toggleDarkMode(mode) {
    if (mode === 'light') {
      return ipcRenderer.invoke('dark-mode:light');
    } else if (mode === 'dark') {
      return ipcRenderer.invoke('dark-mode:dark');
    } else if (mode === 'system') {
      return ipcRenderer.invoke('dark-mode:system');
    }
  },
  getBackupsInterval() {
    return ipcRenderer.invoke('get-backups-interval');
  },
  setBackupsInterval(value) {
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
  onBackupsStatusChanged(func) {
    const eventName = 'backups-status-changed';
    const callback = (_, v) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  chooseSyncRootWithDialog() {
    return ipcRenderer.invoke('choose-sync-root-with-dialog');
  },
  getOrCreateDevice() {
    return ipcRenderer.invoke('get-or-create-device');
  },
  renameDevice(deviceName) {
    return ipcRenderer.invoke('rename-device', deviceName);
  },
  getBackups() {
    return ipcRenderer.invoke('get-backups');
  },
  devices: {
    getDevices: () => {
      return ipcRenderer.invoke('devices.get-all');
    },
  },
  getBackupsFromDevice(device, isCurrent) {
    return ipcRenderer.invoke('get-backups-from-device', device, isCurrent);
  },
  addBackup() {
    return ipcRenderer.invoke('add-backup');
  },
  addBackupsFromLocalPaths(localPaths) {
    return ipcRenderer.invoke('add-multiple-backups', localPaths);
  },
  deleteBackup(backup) {
    return ipcRenderer.invoke('delete-backup', backup);
  },
  deleteBackupsFromDevice(device, isCurrent) {
    return ipcRenderer.invoke('delete-backups-from-device', device, isCurrent);
  },
  disableBackup(backup) {
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
  onBackupProgress(func) {
    const eventName = 'backup-progress';
    const callback = (_, v) => func(v);
    ipcRenderer.on(eventName, callback);

    return () => ipcRenderer.removeListener(eventName, callback);
  },
  onBackupDownloadProgress(func) {
    const eventName = 'backup-download-progress';
    const callback = (_, v) => func(v);
    ipcRenderer.on(eventName, callback);

    return () => ipcRenderer.removeListener(eventName, callback);
  },
  abortDownloadBackups(deviceUuid) {
    return ipcRenderer.send('abort-download-backups-' + deviceUuid, deviceUuid);
  },
  getItemByFolderUuid(folderUuid) {
    return ipcRenderer.invoke('get-item-by-folder-uuid', folderUuid);
  },

  deleteBackupError(folderId) {
    return ipcRenderer.invoke('delete-backup-error', folderId);
  },
  downloadBackup(backup, folderUuids) {
    return ipcRenderer.invoke('download-backup', backup, folderUuids);
  },
  changeBackupPath(currentPath) {
    return ipcRenderer.invoke('change-backup-path', currentPath);
  },
  getFolderPath() {
    return ipcRenderer.invoke('get-folder-path');
  },
  startMigration() {
    return ipcRenderer.invoke('open-migration-window');
  },
  getUsage() {
    return ipcRenderer.invoke('get-usage');
  },
  resizeWindow(dimensions) {
    return ipcRenderer.invoke('resize-focused-window', dimensions);
  },
  addFakeIssues(errorsName, process) {
    return ipcRenderer.invoke('add-fake-sync-issues', { errorsName, process });
  },
  onRemoteSyncStatusChange(callback) {
    const eventName = 'remote-sync-status-change';
    const callbackWrapper = (_, v) => {
      callback(v);
    };
    ipcRenderer.on(eventName, callbackWrapper);

    return () => ipcRenderer.removeListener(eventName, callbackWrapper);
  },
  getRemoteSyncStatus() {
    return ipcRenderer.invoke('get-remote-sync-status');
  },
  retryVirtualDriveMount() {
    return ipcRenderer.invoke('retry-virtual-drive-mount');
  },
  onVirtualDriveStatusChange(callback) {
    const eventName = 'virtual-drive-status-change';
    const callbackWrapper = (_, v) => {
      callback(v);
    };
    ipcRenderer.on(eventName, callbackWrapper);

    return () => ipcRenderer.removeListener(eventName, callbackWrapper);
  },
  openUrl: (url) => {
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
  getRecentlywasSyncing() {
    return ipcRenderer.invoke('CHECK_SYNC_IN_PROGRESS');
  },

  user: {
    hasDiscoveredBackups() {
      return ipcRenderer.invoke('user.get-has-discovered-backups');
    },
    discoveredBackups() {
      ipcRenderer.send('user.set-has-discovered-backups');
    },
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
    scanItems: (paths) => {
      return ipcRenderer.invoke('antivirus:scan-items', paths);
    },

    onScanProgress: (callback) => {
      ipcRenderer.on('antivirus:scan-progress', (_, progress) => callback(progress));
    },
    removeScanProgressListener: () => {
      ipcRenderer.removeAllListeners('antivirus:scan-progress');
    },
    scanSystem: (systemPath) => {
      return ipcRenderer.invoke('antivirus:scan-system', systemPath);
    },
    addItemsToScan: (getFiles) => {
      return ipcRenderer.invoke('antivirus:add-items-to-scan', getFiles);
    },
    removeInfectedFiles: (infectedFiles) => {
      return ipcRenderer.invoke('antivirus:remove-infected-files', infectedFiles);
    },
    cancelScan: () => {
      return ipcRenderer.invoke('antivirus:cancel-scan');
    },
  },
  authService: {
    access: (props) => {
      return ipcRenderer.invoke('renderer.login-access', props);
    },
    login: (props) => {
      return ipcRenderer.invoke('renderer.login', props);
    },
  },
  path,
});
