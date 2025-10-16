"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/apps/main/preload.ts
var import_backend = require("@internxt/drive-desktop-core/build/backend");
var import_electron2 = require("electron");
var import_node_path = __toESM(require("node:path"));

// src/apps/main/preload/ipc-renderer.ts
var import_electron = require("electron");
var ipcPreloadRenderer = import_electron.ipcRenderer;

// src/apps/main/preload.ts
var api = {
  getConfigKey(key) {
    return import_electron2.ipcRenderer.invoke("get-config-key", key);
  },
  setConfigKey(props) {
    import_electron2.ipcRenderer.send("set-config-key", props);
  },
  listenToConfigKeyChange(key, fn) {
    const eventName = `${key}-updated`;
    const callback = (_, v) => fn(v);
    import_electron2.ipcRenderer.on(eventName, (_, v) => fn(v));
    return () => import_electron2.ipcRenderer.removeListener(eventName, callback);
  },
  logger: {
    debug: (rawBody) => import_backend.logger.debug(rawBody),
    warn: (rawBody) => import_backend.logger.warn(rawBody),
    error: (rawBody) => import_backend.logger.error(rawBody)
  },
  pathChanged(pathname) {
    import_electron2.ipcRenderer.send("path-changed", pathname);
  },
  userLoggedIn(data) {
    import_electron2.ipcRenderer.send("user-logged-in", data);
  },
  isUserLoggedIn() {
    return import_electron2.ipcRenderer.invoke("is-user-logged-in");
  },
  onUserLoggedInChanged(func) {
    import_electron2.ipcRenderer.on("user-logged-in-changed", (_, v) => func(v));
  },
  userLogginFailed(email) {
    import_electron2.ipcRenderer.send("USER_LOGIN_FAILED", email);
  },
  logout() {
    import_electron2.ipcRenderer.send("USER_LOGGED_OUT");
  },
  closeWindow() {
    import_electron2.ipcRenderer.send("user-closed-window");
  },
  minimizeWindow() {
    import_electron2.ipcRenderer.send("user-minimized-window");
  },
  openVirtualDriveFolder() {
    return import_electron2.ipcRenderer.invoke("open-virtual-drive-folder");
  },
  quit() {
    import_electron2.ipcRenderer.send("user-quit");
  },
  getUser() {
    return import_electron2.ipcRenderer.invoke("get-user");
  },
  startSyncProcess() {
    import_electron2.ipcRenderer.send("start-sync-process");
  },
  stopSyncProcess() {
    import_electron2.ipcRenderer.send("stop-sync-process");
  },
  getSyncStatus() {
    return import_electron2.ipcRenderer.invoke("get-sync-status");
  },
  onSyncInfoUpdate(func) {
    const eventName = "sync-info-update";
    const callback = (_, v) => func(v);
    import_electron2.ipcRenderer.on(eventName, callback);
    return () => import_electron2.ipcRenderer.removeListener(eventName, callback);
  },
  getIssues() {
    return import_electron2.ipcRenderer.invoke("get-issues");
  },
  onIssuesChanged(func) {
    const eventName = "issues-changed";
    const callback = (_, v) => func(v);
    import_electron2.ipcRenderer.on(eventName, callback);
    return () => import_electron2.ipcRenderer.removeListener(eventName, callback);
  },
  openProcessIssuesWindow() {
    import_electron2.ipcRenderer.send("open-process-issues-window");
  },
  openSettingsWindow(section) {
    import_electron2.ipcRenderer.send("open-settings-window", section);
  },
  settingsWindowResized(payload) {
    import_electron2.ipcRenderer.send("settings-window-resized", payload);
  },
  finishOnboarding() {
    import_electron2.ipcRenderer.send("user-finished-onboarding");
  },
  finishMigration() {
    import_electron2.ipcRenderer.send("user-finished-migration");
  },
  isAutoLaunchEnabled() {
    return import_electron2.ipcRenderer.invoke("is-auto-launch-enabled");
  },
  toggleAutoLaunch() {
    return import_electron2.ipcRenderer.invoke("toggle-auto-launch");
  },
  toggleDarkMode(mode) {
    if (mode === "light") return import_electron2.ipcRenderer.invoke("dark-mode:light");
    if (mode === "dark") return import_electron2.ipcRenderer.invoke("dark-mode:dark");
    return import_electron2.ipcRenderer.invoke("dark-mode:system");
  },
  listenToSystemThemeChange(fn) {
    const eventName = "system-theme-updated";
    const callback = (_, theme) => fn(theme);
    import_electron2.ipcRenderer.on(eventName, callback);
    return () => import_electron2.ipcRenderer.removeListener(eventName, callback);
  },
  getBackupsInterval() {
    return import_electron2.ipcRenderer.invoke("get-backups-interval");
  },
  setBackupsInterval(value) {
    return import_electron2.ipcRenderer.invoke("set-backups-interval", value);
  },
  startBackupsProcess() {
    import_electron2.ipcRenderer.send("start-backups-process");
  },
  stopBackupsProcess() {
    import_electron2.ipcRenderer.send("stop-backups-process");
  },
  getBackupsStatus() {
    return import_electron2.ipcRenderer.invoke("get-backups-status");
  },
  openVirtualDrive() {
    return import_electron2.ipcRenderer.invoke("open-virtual-drive");
  },
  moveSyncFolderToDesktop() {
    return import_electron2.ipcRenderer.invoke("move-sync-folder-to-desktop");
  },
  // Open the folder where we store the items
  // that we failed to migrate
  openMigrationFailedFolder() {
    return import_electron2.ipcRenderer.invoke("open-migration-failed-folder");
  },
  onBackupsStatusChanged(func) {
    const eventName = "backups-status-changed";
    const callback = (_, v) => func(v);
    import_electron2.ipcRenderer.on(eventName, callback);
    return () => import_electron2.ipcRenderer.removeListener(eventName, callback);
  },
  chooseSyncRootWithDialog() {
    return import_electron2.ipcRenderer.invoke("choose-sync-root-with-dialog");
  },
  getOrCreateDevice() {
    return import_electron2.ipcRenderer.invoke("get-or-create-device");
  },
  renameDevice(deviceName) {
    return import_electron2.ipcRenderer.invoke("rename-device", deviceName);
  },
  getBackups() {
    return import_electron2.ipcRenderer.invoke("get-backups");
  },
  devices: {
    getDevices: () => {
      return import_electron2.ipcRenderer.invoke("devices.get-all");
    }
  },
  getBackupsFromDevice: (device, isCurrent) => {
    return import_electron2.ipcRenderer.invoke("get-backups-from-device", device, isCurrent);
  },
  addBackup() {
    return import_electron2.ipcRenderer.invoke("add-backup");
  },
  addBackupsFromLocalPaths(localPaths) {
    return import_electron2.ipcRenderer.invoke("add-multiple-backups", localPaths);
  },
  deleteBackup(backup) {
    return import_electron2.ipcRenderer.invoke("delete-backup", backup);
  },
  deleteBackupsFromDevice(device, isCurrent) {
    return import_electron2.ipcRenderer.invoke("delete-backups-from-device", device, isCurrent);
  },
  disableBackup(backup) {
    return import_electron2.ipcRenderer.invoke("disable-backup", backup);
  },
  getBackupsEnabled() {
    return import_electron2.ipcRenderer.invoke("get-backups-enabled");
  },
  toggleBackupsEnabled() {
    return import_electron2.ipcRenderer.invoke("toggle-backups-enabled");
  },
  getLastBackupTimestamp() {
    return import_electron2.ipcRenderer.invoke("get-last-backup-timestamp");
  },
  onBackupProgress(func) {
    const eventName = "backup-progress";
    const callback = (_, v) => func(v);
    import_electron2.ipcRenderer.on(eventName, callback);
    return () => import_electron2.ipcRenderer.removeListener(eventName, callback);
  },
  onBackupDownloadProgress(func) {
    const eventName = "backup-download-progress";
    const callback = (_, v) => func(v);
    import_electron2.ipcRenderer.on(eventName, callback);
    return () => import_electron2.ipcRenderer.removeListener(eventName, callback);
  },
  abortDownloadBackups(deviceUuid) {
    import_electron2.ipcRenderer.send("abort-download-backups-" + deviceUuid, deviceUuid);
  },
  getItemByFolderUuid(folderUuid) {
    return import_electron2.ipcRenderer.invoke("get-item-by-folder-uuid", folderUuid);
  },
  deleteBackupError(folderId) {
    return import_electron2.ipcRenderer.invoke("delete-backup-error", folderId);
  },
  downloadBackup(backup, folderUuids) {
    return import_electron2.ipcRenderer.invoke("download-backup", backup, folderUuids);
  },
  changeBackupPath(currentPath) {
    return import_electron2.ipcRenderer.invoke("change-backup-path", currentPath);
  },
  getFolderPath() {
    return import_electron2.ipcRenderer.invoke("get-folder-path");
  },
  startMigration() {
    return import_electron2.ipcRenderer.invoke("open-migration-window");
  },
  onRemoteSyncStatusChange(callback) {
    const eventName = "remote-sync-status-change";
    const callbackWrapper = (_, v) => callback(v);
    import_electron2.ipcRenderer.on(eventName, callbackWrapper);
    return () => import_electron2.ipcRenderer.removeListener(eventName, callbackWrapper);
  },
  getRemoteSyncStatus() {
    return import_electron2.ipcRenderer.invoke("get-remote-sync-status");
  },
  retryVirtualDriveMount() {
    return import_electron2.ipcRenderer.invoke("retry-virtual-drive-mount");
  },
  openUrl: (url) => {
    return import_electron2.ipcRenderer.invoke("open-url", url);
  },
  getPreferredAppLanguage() {
    return import_electron2.ipcRenderer.invoke("APP:PREFERRED_LANGUAGE");
  },
  syncManually() {
    return import_electron2.ipcRenderer.invoke("SYNC_MANUALLY");
  },
  getUnsycFileInSyncEngine() {
    return import_electron2.ipcRenderer.invoke("GET_UNSYNC_FILE_IN_SYNC_ENGINE");
  },
  getRecentlywasSyncing() {
    return import_electron2.ipcRenderer.invoke("CHECK_SYNC_IN_PROGRESS");
  },
  user: {
    hasDiscoveredBackups() {
      return import_electron2.ipcRenderer.invoke("user.get-has-discovered-backups");
    },
    discoveredBackups() {
      import_electron2.ipcRenderer.send("user.set-has-discovered-backups");
    }
  },
  antivirus: {
    isAvailable() {
      return import_electron2.ipcRenderer.invoke("antivirus:is-available");
    },
    scanItems(paths) {
      return import_electron2.ipcRenderer.invoke("antivirus:scan-items", paths);
    },
    onScanProgress: (callback) => {
      import_electron2.ipcRenderer.on("antivirus:scan-progress", (_, progress) => callback(progress));
    },
    removeScanProgressListener() {
      import_electron2.ipcRenderer.removeAllListeners("antivirus:scan-progress");
    },
    addItemsToScan: (getFiles) => {
      return import_electron2.ipcRenderer.invoke("antivirus:add-items-to-scan", getFiles);
    },
    removeInfectedFiles: (infectedFiles) => {
      return import_electron2.ipcRenderer.invoke("antivirus:remove-infected-files", infectedFiles);
    },
    cancelScan() {
      return import_electron2.ipcRenderer.invoke("antivirus:cancel-scan");
    }
  },
  path: import_node_path.default,
  authAccess: async (props) => await ipcPreloadRenderer.invoke("authAccess", props),
  authLogin: async (props) => await ipcPreloadRenderer.invoke("authLogin", props),
  getLastBackupProgress: () => ipcPreloadRenderer.send("getLastBackupProgress"),
  getUsage: async () => await ipcPreloadRenderer.invoke("getUsage"),
  getAvailableProducts: async () => await ipcPreloadRenderer.invoke("getAvailableProducts"),
  cleanerGenerateReport: async (props) => await ipcPreloadRenderer.invoke("cleanerGenerateReport", props),
  cleanerStartCleanup: async (props) => await ipcPreloadRenderer.invoke("cleanerStartCleanup", props),
  cleanerGetDiskSpace: async () => await ipcPreloadRenderer.invoke("cleanerGetDiskSpace"),
  cleanerStopCleanup: () => ipcPreloadRenderer.send("cleanerStopCleanup"),
  getSystemTheme: async () => await ipcPreloadRenderer.invoke("getSystemTheme"),
  cleanerOnProgress: (callback) => {
    const eventName = "cleaner:cleanup-progress";
    const callbackWrapper = (_, progressData) => callback(progressData);
    import_electron2.ipcRenderer.on(eventName, callbackWrapper);
    return () => {
      import_electron2.ipcRenderer.removeListener(eventName, callbackWrapper);
    };
  },
  openLogs: async () => await ipcPreloadRenderer.invoke("openLogs")
};
import_electron2.contextBridge.exposeInMainWorld("electron", api);
