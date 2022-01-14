const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  pathChanged(path) {
    ipcRenderer.send('path-changed', path);
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
  getHeaders() {
    return ipcRenderer.invoke('get-headers');
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
    return ipcRenderer.on('sync-status-changed', (_, v) => func(v));
  },
  onSyncStopped(func) {
    return ipcRenderer.on('sync-stopped', (_, v) => func(v));
  },
  onSyncInfoUpdate(func) {
    return ipcRenderer.on('sync-info-update', (_, v) => func(v));
  },
  getSyncIssues() {
    return ipcRenderer.invoke('get-sync-issues');
  },
  onSyncIssuesChanged(func) {
    return ipcRenderer.on('sync-issues-changed', (_, v) => func(v));
  },

  env: { ...process.env },
});
