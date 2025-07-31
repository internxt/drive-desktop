'use strict';
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) =>
  function __require() {
    return (mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports);
  };
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === 'object') || typeof from === 'function') {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (
  (target = mod != null ? __create(__getProtoOf(mod)) : {}),
  __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, 'default', { value: mod, enumerable: true }) : target,
    mod,
  )
);

// node_modules/@internxt/drive-desktop-core/build/backend/core/logger/logger.js
var require_logger = __commonJS({
  'node_modules/@internxt/drive-desktop-core/build/backend/core/logger/logger.js'(exports2) {
    'use strict';
    var __importDefault =
      (exports2 && exports2.__importDefault) ||
      function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
      };
    Object.defineProperty(exports2, '__esModule', { value: true });
    exports2.logger = void 0;
    var electron_log_1 = __importDefault(require('electron-log'));
    var node_util_1 = require('node:util');
    function getLevelStr(level) {
      switch (level) {
        case 'debug':
          return ' ';
        case 'warn':
          return 'w';
        case 'error':
          return 'E';
      }
    }
    function getProcessStr() {
      switch (process.type) {
        case 'browser':
          return 'b';
        case 'renderer':
          return 'r';
        case 'worker':
          return 'w';
        case 'utility':
          return 'u';
        case 'service-worker':
          return 's';
      }
    }
    function getTagStr(tag) {
      switch (tag) {
        case 'AUTH':
          return 'auth';
        case 'BACKUPS':
          return 'back';
        case 'SYNC-ENGINE':
          return 'sync';
        case 'ANTIVIRUS':
          return 'anti';
        case 'NODE-WIN':
          return 'sync';
        default:
          return '    ';
      }
    }
    function prepareBody(level, rawBody) {
      const { tag, msg, workspaceId, attributes, ...rest } = rawBody;
      const header = `${getLevelStr(level)} - ${getProcessStr()} - ${getTagStr(tag)}`;
      rawBody = {
        header,
        msg,
        ...(workspaceId && { workspaceId }),
        ...rest,
      };
      const body = (0, node_util_1.inspect)(rawBody, { depth: Infinity, breakLength: Infinity });
      const coloredBody = (0, node_util_1.inspect)(rawBody, { depth: Infinity, breakLength: Infinity, colors: true });
      return { attributes, body, coloredBody };
    }
    function debug(rawBody) {
      const { body, coloredBody } = prepareBody('debug', rawBody);
      electron_log_1.default.silly(coloredBody);
      electron_log_1.default.debug(body);
      return new Error(rawBody.msg, { cause: rawBody.exc });
    }
    function warn(rawBody) {
      const { body, coloredBody } = prepareBody('warn', rawBody);
      electron_log_1.default.silly(coloredBody);
      electron_log_1.default.debug(body);
      return new Error(rawBody.msg, { cause: rawBody.exc });
    }
    function error(rawBody) {
      const { body, coloredBody } = prepareBody('error', rawBody);
      electron_log_1.default.silly(coloredBody);
      electron_log_1.default.debug(body);
      electron_log_1.default.info(body);
      return new Error(rawBody.msg, { cause: rawBody.exc });
    }
    exports2.logger = {
      debug,
      warn,
      error,
    };
  },
});

// node_modules/@internxt/drive-desktop-core/build/backend/core/logger/convert-utc-date-to-gmt2.js
var require_convert_utc_date_to_gmt2 = __commonJS({
  'node_modules/@internxt/drive-desktop-core/build/backend/core/logger/convert-utc-date-to-gmt2.js'(exports2) {
    'use strict';
    Object.defineProperty(exports2, '__esModule', { value: true });
    exports2.convertUTCDateToGMT2 = convertUTCDateToGMT2;
    function pad(n) {
      return n.toString().padStart(2, '0');
    }
    function padMs(n) {
      return n.toString().padStart(3, '0');
    }
    function formatDate(date) {
      return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}.${padMs(date.getUTCMilliseconds())}`;
    }
    function convertUTCDateToGMT2(date) {
      const gmt2Date = new Date(date.getTime() + 2 * 60 * 60 * 1e3);
      return formatDate(gmt2Date);
    }
  },
});

// node_modules/@internxt/drive-desktop-core/build/backend/core/logger/log-formatter.js
var require_log_formatter = __commonJS({
  'node_modules/@internxt/drive-desktop-core/build/backend/core/logger/log-formatter.js'(exports2) {
    'use strict';
    Object.defineProperty(exports2, '__esModule', { value: true });
    exports2.logFormatter = logFormatter;
    var convert_utc_date_to_gmt2_1 = require_convert_utc_date_to_gmt2();
    function logFormatter(message) {
      return [`[${(0, convert_utc_date_to_gmt2_1.convertUTCDateToGMT2)(message.message.date)}]`, ...message.data];
    }
  },
});

// node_modules/@internxt/drive-desktop-core/build/backend/core/logger/setup-electron-log.js
var require_setup_electron_log = __commonJS({
  'node_modules/@internxt/drive-desktop-core/build/backend/core/logger/setup-electron-log.js'(exports2) {
    'use strict';
    var __importDefault =
      (exports2 && exports2.__importDefault) ||
      function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
      };
    Object.defineProperty(exports2, '__esModule', { value: true });
    exports2.setupElectronLog = setupElectronLog;
    var electron_1 = require('electron');
    var electron_log_1 = __importDefault(require('electron-log'));
    var log_formatter_1 = require_log_formatter();
    function setupElectronLog({ logsPath, importantLogsPath }) {
      electron_log_1.default.initialize();
      electron_log_1.default.transports.file.resolvePathFn = (_, message) => {
        if (message?.level === 'info') {
          return importantLogsPath;
        } else {
          return logsPath;
        }
      };
      electron_log_1.default.transports.file.maxSize = 1024 * 1024 * 1024;
      electron_log_1.default.transports.file.format = log_formatter_1.logFormatter;
      electron_log_1.default.transports.file.level = 'debug';
      electron_log_1.default.transports.console.format = (message) => [...message.data];
      electron_log_1.default.transports.console.writeFn = ({ message }) => {
        if (message.level === 'silly') {
          console.log(`${message.data}`);
        }
      };
      electron_1.ipcMain.on('open-logs', () => {
        void electron_1.shell.openPath(logsPath);
      });
    }
  },
});

// node_modules/@internxt/drive-desktop-core/build/backend/index.js
var require_backend = __commonJS({
  'node_modules/@internxt/drive-desktop-core/build/backend/index.js'(exports2) {
    'use strict';
    Object.defineProperty(exports2, '__esModule', { value: true });
    exports2.setupElectronLog = exports2.logger = void 0;
    var logger_1 = require_logger();
    Object.defineProperty(exports2, 'logger', {
      enumerable: true,
      get: function () {
        return logger_1.logger;
      },
    });
    var setup_electron_log_1 = require_setup_electron_log();
    Object.defineProperty(exports2, 'setupElectronLog', {
      enumerable: true,
      get: function () {
        return setup_electron_log_1.setupElectronLog;
      },
    });
  },
});

// src/apps/main/preload.ts
var import_backend = __toESM(require_backend());
var import_electron = require('electron');
var import_path = __toESM(require('path'));
var api = {
  getConfigKey(key) {
    return import_electron.ipcRenderer.invoke('get-config-key', key);
  },
  setConfigKey(props) {
    import_electron.ipcRenderer.send('set-config-key', props);
  },
  listenToConfigKeyChange(key, fn) {
    const eventName = `${key}-updated`;
    const callback = (_, v) => fn(v);
    import_electron.ipcRenderer.on(eventName, (_, v) => fn(v));
    return () => import_electron.ipcRenderer.removeListener(eventName, callback);
  },
  logger: {
    debug: (rawBody) => import_backend.logger.debug(rawBody),
    warn: (rawBody) => import_backend.logger.warn(rawBody),
    error: (rawBody) => import_backend.logger.error(rawBody),
  },
  pathChanged(pathname) {
    import_electron.ipcRenderer.send('path-changed', pathname);
  },
  userLoggedIn(data) {
    import_electron.ipcRenderer.send('user-logged-in', data);
  },
  isUserLoggedIn() {
    return import_electron.ipcRenderer.invoke('is-user-logged-in');
  },
  onUserLoggedInChanged(func) {
    import_electron.ipcRenderer.on('user-logged-in-changed', (_, v) => func(v));
  },
  userLogginFailed(email) {
    import_electron.ipcRenderer.send('USER_LOGIN_FAILED', email);
  },
  logout() {
    import_electron.ipcRenderer.send('USER_LOGGED_OUT');
  },
  closeWindow() {
    import_electron.ipcRenderer.send('user-closed-window');
  },
  minimizeWindow() {
    import_electron.ipcRenderer.send('user-minimized-window');
  },
  openVirtualDriveFolder() {
    return import_electron.ipcRenderer.invoke('open-virtual-drive-folder');
  },
  quit() {
    import_electron.ipcRenderer.send('user-quit');
  },
  getUser() {
    return import_electron.ipcRenderer.invoke('get-user');
  },
  startSyncProcess() {
    import_electron.ipcRenderer.send('start-sync-process');
  },
  stopSyncProcess() {
    import_electron.ipcRenderer.send('stop-sync-process');
  },
  getSyncStatus() {
    return import_electron.ipcRenderer.invoke('get-sync-status');
  },
  onSyncInfoUpdate(func) {
    const eventName = 'sync-info-update';
    const callback = (_, v) => func(v);
    import_electron.ipcRenderer.on(eventName, callback);
    return () => import_electron.ipcRenderer.removeListener(eventName, callback);
  },
  getIssues() {
    return import_electron.ipcRenderer.invoke('get-issues');
  },
  onIssuesChanged(func) {
    const eventName = 'issues-changed';
    const callback = (_, v) => func(v);
    import_electron.ipcRenderer.on(eventName, callback);
    return () => import_electron.ipcRenderer.removeListener(eventName, callback);
  },
  openProcessIssuesWindow() {
    import_electron.ipcRenderer.send('open-process-issues-window');
  },
  openLogs() {
    import_electron.ipcRenderer.send('open-logs');
  },
  openSettingsWindow(section) {
    import_electron.ipcRenderer.send('open-settings-window', section);
  },
  settingsWindowResized(payload) {
    import_electron.ipcRenderer.send('settings-window-resized', payload);
  },
  finishOnboarding() {
    import_electron.ipcRenderer.send('user-finished-onboarding');
  },
  finishMigration() {
    import_electron.ipcRenderer.send('user-finished-migration');
  },
  isAutoLaunchEnabled() {
    return import_electron.ipcRenderer.invoke('is-auto-launch-enabled');
  },
  toggleAutoLaunch() {
    return import_electron.ipcRenderer.invoke('toggle-auto-launch');
  },
  toggleDarkMode(mode) {
    if (mode === 'light') return import_electron.ipcRenderer.invoke('dark-mode:light');
    if (mode === 'dark') return import_electron.ipcRenderer.invoke('dark-mode:dark');
    return import_electron.ipcRenderer.invoke('dark-mode:system');
  },
  getBackupsInterval() {
    return import_electron.ipcRenderer.invoke('get-backups-interval');
  },
  setBackupsInterval(value) {
    return import_electron.ipcRenderer.invoke('set-backups-interval', value);
  },
  startBackupsProcess() {
    import_electron.ipcRenderer.send('start-backups-process');
  },
  stopBackupsProcess() {
    import_electron.ipcRenderer.send('stop-backups-process');
  },
  getBackupsStatus() {
    return import_electron.ipcRenderer.invoke('get-backups-status');
  },
  openVirtualDrive() {
    return import_electron.ipcRenderer.invoke('open-virtual-drive');
  },
  moveSyncFolderToDesktop() {
    return import_electron.ipcRenderer.invoke('move-sync-folder-to-desktop');
  },
  // Open the folder where we store the items
  // that we failed to migrate
  openMigrationFailedFolder() {
    return import_electron.ipcRenderer.invoke('open-migration-failed-folder');
  },
  onBackupsStatusChanged(func) {
    const eventName = 'backups-status-changed';
    const callback = (_, v) => func(v);
    import_electron.ipcRenderer.on(eventName, callback);
    return () => import_electron.ipcRenderer.removeListener(eventName, callback);
  },
  chooseSyncRootWithDialog() {
    return import_electron.ipcRenderer.invoke('choose-sync-root-with-dialog');
  },
  getOrCreateDevice() {
    return import_electron.ipcRenderer.invoke('get-or-create-device');
  },
  renameDevice(deviceName) {
    return import_electron.ipcRenderer.invoke('rename-device', deviceName);
  },
  getBackups() {
    return import_electron.ipcRenderer.invoke('get-backups');
  },
  devices: {
    getDevices: () => {
      return import_electron.ipcRenderer.invoke('devices.get-all');
    },
  },
  getBackupsFromDevice: (device, isCurrent) => {
    return import_electron.ipcRenderer.invoke('get-backups-from-device', device, isCurrent);
  },
  addBackup() {
    return import_electron.ipcRenderer.invoke('add-backup');
  },
  addBackupsFromLocalPaths(localPaths) {
    return import_electron.ipcRenderer.invoke('add-multiple-backups', localPaths);
  },
  deleteBackup(backup) {
    return import_electron.ipcRenderer.invoke('delete-backup', backup);
  },
  deleteBackupsFromDevice(device, isCurrent) {
    return import_electron.ipcRenderer.invoke('delete-backups-from-device', device, isCurrent);
  },
  disableBackup(backup) {
    return import_electron.ipcRenderer.invoke('disable-backup', backup);
  },
  getBackupsEnabled() {
    return import_electron.ipcRenderer.invoke('get-backups-enabled');
  },
  toggleBackupsEnabled() {
    return import_electron.ipcRenderer.invoke('toggle-backups-enabled');
  },
  getLastBackupTimestamp() {
    return import_electron.ipcRenderer.invoke('get-last-backup-timestamp');
  },
  getLastBackupProgress() {
    import_electron.ipcRenderer.send('backups.get-last-progress');
  },
  onBackupProgress(func) {
    const eventName = 'backup-progress';
    const callback = (_, v) => func(v);
    import_electron.ipcRenderer.on(eventName, callback);
    return () => import_electron.ipcRenderer.removeListener(eventName, callback);
  },
  onBackupDownloadProgress(func) {
    const eventName = 'backup-download-progress';
    const callback = (_, v) => func(v);
    import_electron.ipcRenderer.on(eventName, callback);
    return () => import_electron.ipcRenderer.removeListener(eventName, callback);
  },
  abortDownloadBackups(deviceUuid) {
    import_electron.ipcRenderer.send('abort-download-backups-' + deviceUuid, deviceUuid);
  },
  getItemByFolderUuid(folderUuid) {
    return import_electron.ipcRenderer.invoke('get-item-by-folder-uuid', folderUuid);
  },
  deleteBackupError(folderId) {
    return import_electron.ipcRenderer.invoke('delete-backup-error', folderId);
  },
  downloadBackup(backup, folderUuids) {
    return import_electron.ipcRenderer.invoke('download-backup', backup, folderUuids);
  },
  changeBackupPath(currentPath) {
    return import_electron.ipcRenderer.invoke('change-backup-path', currentPath);
  },
  getFolderPath() {
    return import_electron.ipcRenderer.invoke('get-folder-path');
  },
  startMigration() {
    return import_electron.ipcRenderer.invoke('open-migration-window');
  },
  getUsage() {
    return import_electron.ipcRenderer.invoke('get-usage');
  },
  onRemoteSyncStatusChange(callback) {
    const eventName = 'remote-sync-status-change';
    const callbackWrapper = (_, v) => callback(v);
    import_electron.ipcRenderer.on(eventName, callbackWrapper);
    return () => import_electron.ipcRenderer.removeListener(eventName, callbackWrapper);
  },
  getRemoteSyncStatus() {
    return import_electron.ipcRenderer.invoke('get-remote-sync-status');
  },
  retryVirtualDriveMount() {
    return import_electron.ipcRenderer.invoke('retry-virtual-drive-mount');
  },
  openUrl: (url) => {
    return import_electron.ipcRenderer.invoke('open-url', url);
  },
  getPreferredAppLanguage() {
    return import_electron.ipcRenderer.invoke('APP:PREFERRED_LANGUAGE');
  },
  syncManually() {
    return import_electron.ipcRenderer.invoke('SYNC_MANUALLY');
  },
  getUnsycFileInSyncEngine() {
    return import_electron.ipcRenderer.invoke('GET_UNSYNC_FILE_IN_SYNC_ENGINE');
  },
  getRecentlywasSyncing() {
    return import_electron.ipcRenderer.invoke('CHECK_SYNC_IN_PROGRESS');
  },
  user: {
    hasDiscoveredBackups() {
      return import_electron.ipcRenderer.invoke('user.get-has-discovered-backups');
    },
    discoveredBackups() {
      import_electron.ipcRenderer.send('user.set-has-discovered-backups');
    },
  },
  backups: {
    isAvailable() {
      return import_electron.ipcRenderer.invoke('backups:is-available');
    },
  },
  antivirus: {
    isAvailable() {
      return import_electron.ipcRenderer.invoke('antivirus:is-available');
    },
    isDefenderActive() {
      return import_electron.ipcRenderer.invoke('antivirus:is-Defender-active');
    },
    scanItems(paths) {
      return import_electron.ipcRenderer.invoke('antivirus:scan-items', paths);
    },
    onScanProgress: (callback) => {
      import_electron.ipcRenderer.on('antivirus:scan-progress', (_, progress) => callback(progress));
    },
    removeScanProgressListener() {
      import_electron.ipcRenderer.removeAllListeners('antivirus:scan-progress');
    },
    addItemsToScan: (getFiles) => {
      return import_electron.ipcRenderer.invoke('antivirus:add-items-to-scan', getFiles);
    },
    removeInfectedFiles: (infectedFiles) => {
      return import_electron.ipcRenderer.invoke('antivirus:remove-infected-files', infectedFiles);
    },
    cancelScan() {
      return import_electron.ipcRenderer.invoke('antivirus:cancel-scan');
    },
  },
  authService: {
    access: (props) => {
      return import_electron.ipcRenderer.invoke('renderer.login-access', props);
    },
    login: (props) => {
      return import_electron.ipcRenderer.invoke('renderer.login', props);
    },
  },
  path: import_path.default,
};
import_electron.contextBridge.exposeInMainWorld('electron', api);
