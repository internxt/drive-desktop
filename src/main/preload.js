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

  env: { ...process.env },
});
