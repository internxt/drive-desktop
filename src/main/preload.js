const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

contextBridge.exposeInMainWorld('electron', {
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
  openSyncFolder() {
    return ipcRenderer.invoke('open-sync-folder');
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
  getProcessIssues() {
    return ipcRenderer.invoke('get-process-issues');
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
  isAutoLaunchEnabled() {
    return ipcRenderer.invoke('is-auto-launch-enabled');
  },
  toggleAutoLaunch() {
    return ipcRenderer.invoke('toggle-auto-launch');
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
  onBackupsStatusChanged(func) {
    const eventName = 'backups-status-changed';
    const callback = (_, v) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  getSyncRoot() {
    return ipcRenderer.invoke('get-sync-root');
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
  addBackup() {
    return ipcRenderer.invoke('add-backup');
  },
  deleteBackup(backup) {
    return ipcRenderer.invoke('delete-backup', backup);
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
  getBackupFatalErrors() {
    return ipcRenderer.invoke('get-backup-fatal-errors');
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
  onRemoteChanges(func) {
    const eventName = 'remote-changes';
    const callback = () => func();
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  getUsage() {
    return ipcRenderer.invoke('get-usage');
  },
  getPlatform() {
    return ipcRenderer.invoke('get-platform');
  },
  path,
});
