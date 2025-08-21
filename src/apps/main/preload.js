const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const { logger } = require('@internxt/drive-desktop-core/build/backend');

contextBridge.exposeInMainWorld('electron', {
  getConfigKey(key) {
    return ipcRenderer.invoke('get-config-key', key);
  },
  setConfigKey(key, value) {
    return ipcRenderer.send('set-config-key', { key, value });
  },
  listenToConfigKeyChange(key, fn) {
    const eventName = `${key}-updated`;
    const callback = (_, v) => fn(v);
    ipcRenderer.on(eventName, (_, v) => fn(v));

    return () => ipcRenderer.removeListener(eventName, callback);
  },

  pathChanged(pathname) {
    ipcRenderer.send('path-changed', pathname);
  },
  userIsUnauthorized() {
    ipcRenderer.send('user-is-unauthorized');
  },
  userLoggedIn(data) {
    return ipcRenderer.send('user-logged-in', data);
  },
  isUserLoggedIn() {
    return ipcRenderer.invoke('is-user-logged-in');
  },
  checkInternetConnection() {
    return ipcRenderer.invoke('check-internet-connection');
  },
  onUserLoggedInChanged(func) {
    return ipcRenderer.on('user-logged-in-changed', (_, v) => func(v));
  },
  userLogginFailed(email) {
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
  getGeneralIssues() {
    return ipcRenderer.invoke('get-general-issues');
  },
  onGeneralIssuesChanged(func) {
    const eventName = 'general-issues-changed';
    const callback = (_, v) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  getVirtualDriveIssues() {
    return ipcRenderer.invoke('get.issues.virtual-drive');
  },
  onProcessIssuesChanged(func) {
    const eventName = 'process-issues-changed';
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
  sendReport(report) {
    return ipcRenderer.invoke('send-report', report);
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
  getBackupFatalIssue(id) {
    return ipcRenderer.invoke('backups.get-backup-issues', id);
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
  getVirtualDriveRoot() {
    return ipcRenderer.invoke('get-virtual-drive-root');
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
  devices: {
    getDevices: () => {
      return ipcRenderer.invoke('devices.get-all');
    },
  },
  onDeviceCreated(func) {
    const eventName = 'device-created';
    const callback = (_, v) => func(v);
    ipcRenderer.on(eventName, callback);

    return () => ipcRenderer.removeListener(eventName, callback);
  },
  getBackupsFromDevice(device, isCurrent) {
    return ipcRenderer.invoke('get-backups-from-device', device, isCurrent);
  },
  addBackup() {
    return ipcRenderer.invoke('add-backup');
  },
  downloadBackup(backup) {
    return ipcRenderer.invoke('download-backup', backup);
  },
  addBackupsFromLocalPaths(localPaths) {
    return ipcRenderer.invoke('add-multiple-backups', localPaths);
  },
  deleteBackup(backup, isCurrent) {
    return ipcRenderer.invoke('delete-backup', backup, isCurrent);
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
  getBackupFatalErrors() {
    return ipcRenderer.invoke('get-backup-fatal-errors');
  },
  deleteBackupError(folderId) {
    return ipcRenderer.invoke('delete-backup-error', folderId);
  },
  onBackupFatalErrorsChanged(func) {
    const eventName = 'backup-fatal-errors-changed';
    const callback = (_, v) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  getLastBackupExitReason() {
    return ipcRenderer.invoke('get-last-backup-exit-reason');
  },
  changeBackupPath(currentPath) {
    return ipcRenderer.invoke('change-backup-path', currentPath);
  },
  getFolderPath() {
    return ipcRenderer.invoke('get-folder-path');
  },
  onRemoteChanges(func) {
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
  resizeWindow(dimensions) {
    return ipcRenderer.invoke('resize-focused-window', dimensions);
  },
  addFakeIssues(errorsName, process) {
    return ipcRenderer.invoke('add-fake-sync-issues', { errorsName, process });
  },
  sendFeedback(feedback) {
    return ipcRenderer.invoke('send-feedback', feedback);
  },
  openFeedbackWindow() {
    return ipcRenderer.invoke('open-feedback-window');
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
  startRemoteSync() {
    return ipcRenderer.invoke('START_REMOTE_SYNC');
  },
  getVirtualDriveStatus() {
    return ipcRenderer.invoke('get-virtual-drive-status');
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
  path,
  user: {
    hasDiscoveredBackups() {
      return ipcRenderer.invoke('user.get-has-discovered-backups');
    },
    discoveredBackups() {
      ipcRenderer.send('user.set-has-discovered-backups');
    },
  },
  onBackupFailed(callback) {
    ipcRenderer.on('backup-failed', (_, error) => callback(error));
    return () => ipcRenderer.removeListener('backup-failed', callback);
  },
  antivirus: {
    /**
     * Check if antivirus feature is available for the current user
     * @returns {Promise<boolean>} Whether antivirus is available
     */
    isAvailable: () => {
      return ipcRenderer.invoke('antivirus:is-available');
    },

    /**
     * Scan items for viruses
     * @param {Array<{path: string, itemName: string, isDirectory: boolean}>} items Items to scan
     * @returns {Promise<void>}
     */
    scanItems: (items) => {
      return ipcRenderer.invoke('antivirus:scan-items', items);
    },

    /**
     * Register callback to receive scan progress updates
     * @param {Function} callback Function to call when progress updates are received
     */
    onScanProgress: (callback) => {
      ipcRenderer.on('antivirus:scan-progress', (_, progress) =>
        callback(progress)
      );
    },

    /**
     * Remove scan progress listener
     */
    removeScanProgressListener: () => {
      ipcRenderer.removeAllListeners('antivirus:scan-progress');
    },

    /**
     * Open dialog to add items to scan
     * @param {boolean} getFiles Whether to get files (true) or directories (false)
     * @returns {Promise<Array<string>>} Selected item paths
     */
    addItemsToScan: (getFiles) => {
      return ipcRenderer.invoke('antivirus:add-items-to-scan', getFiles);
    },

    /**
     * Remove infected files by moving them to trash
     * @param {Array<string>} infectedFiles Array of file paths to remove
     * @returns {Promise<void>}
     */
    removeInfectedFiles: (infectedFiles) => {
      return ipcRenderer.invoke(
        'antivirus:remove-infected-files',
        infectedFiles
      );
    },

    /**
     * Cancel ongoing antivirus scan
     * @returns {Promise<void>}
     */
    cancelScan: () => {
      return ipcRenderer.invoke('antivirus:cancel-scan');
    },
  },
  userAvailableProducts: {
    get: () => ipcRenderer.invoke('get-available-user-products'),
    subscribe: () => ipcRenderer.send('subscribe-available-user-products'),
    onUpdate: (callback) => {
      const listener = (_event, products) => {
        callback(products);
      };
      ipcRenderer.on('available-user-products-updated', listener);
      return () => {
        ipcRenderer.removeListener('available-user-products-updated', listener);
      };
    },
  },
  login: (email) => ipcRenderer.invoke('auth:login', email),
  access: (credentials) => ipcRenderer.invoke('auth:access', credentials),
  logger: {
    debug: (rawBody) => logger.debug(rawBody),
    warn: (rawBody) => logger.warn(rawBody),
    error: (rawBody) => logger.error(rawBody),
  },
});
