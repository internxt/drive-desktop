import { logger, TLoggerBody } from '@internxt/drive-desktop-core/build/backend';
import { contextBridge, ipcRenderer, shell } from 'electron';
import path from 'node:path';
import { RemoteSyncStatus } from './remote-sync/helpers';
import { StoredValues } from './config/service';
import { SelectedItemToScanProps } from './antivirus/antivirus-clam-av';
import { getUser } from './auth/service';
import { Issue } from './background-processes/issues';
import { BackupsStatus } from './background-processes/backups/BackupsProcessStatus/BackupsStatus';
import { Device, getOrCreateDevice, renameDevice } from './device/service';
import { BackupsProgress } from './background-processes/backups/types/BackupsProgress';
import { ItemBackup } from '../shared/types/items';
import { getBackupsFromDevice } from './device/get-backups-from-device';
import { ipcPreloadRenderer } from './preload/ipc-renderer';
import { FromProcess } from './preload/ipc';
import { CleanupProgress } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';
import { SyncStateItem } from '@/backend/features/local-sync/sync-state/defs';
import { BackupDownloadProgress } from './windows/broadcast-to-windows';

const api = {
  listenToConfigKeyChange<T>(key: StoredValues, fn: (_: T) => void): () => void {
    const eventName = `${key}-updated`;
    const callback = (_: unknown, v: T) => fn(v);
    ipcRenderer.on(eventName, (_, v) => fn(v));
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  logger: {
    debug: (rawBody: TLoggerBody) => logger.debug(rawBody),
    warn: (rawBody: TLoggerBody) => logger.warn(rawBody),
    error: (rawBody: TLoggerBody) => logger.error(rawBody),
  },
  isUserLoggedIn(): Promise<boolean> {
    return ipcRenderer.invoke('is-user-logged-in');
  },
  onUserLoggedInChanged(func: (_: boolean) => void) {
    ipcRenderer.on('user-logged-in-changed', (_, v) => func(v));
  },
  logout() {
    ipcRenderer.send('USER_LOGGED_OUT');
  },
  closeWindow() {
    ipcRenderer.send('user-closed-window');
  },
  quit() {
    ipcRenderer.send('user-quit');
  },
  getUser(): Promise<ReturnType<typeof getUser>> {
    return ipcRenderer.invoke('get-user');
  },
  onSyncInfoUpdate(func: (_: SyncStateItem[]) => void): () => void {
    const eventName = 'sync-info-update';
    const callback = (_: unknown, v: SyncStateItem[]) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  getIssues() {
    return ipcRenderer.invoke('get-issues');
  },
  onIssuesChanged(func: (_: Issue[]) => void): () => void {
    const eventName = 'issues-changed';
    const callback = (_: unknown, v: Issue[]) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  openProcessIssuesWindow() {
    ipcRenderer.send('open-process-issues-window');
  },
  openSettingsWindow(section?: 'BACKUPS' | 'GENERAL' | 'ACCOUNT' | 'ANTIVIRUS' | 'CLEANER') {
    ipcRenderer.send('open-settings-window', section);
  },
  settingsWindowResized(payload: { width: number; height: number }) {
    ipcRenderer.send('settings-window-resized', payload);
  },
  finishOnboarding() {
    ipcRenderer.send('user-finished-onboarding');
  },
  isAutoLaunchEnabled() {
    return ipcRenderer.invoke('is-auto-launch-enabled');
  },
  toggleAutoLaunch() {
    return ipcRenderer.invoke('toggle-auto-launch');
  },
  getBackupsInterval(): Promise<number> {
    return ipcRenderer.invoke('get-backups-interval');
  },
  stopBackupsProcess() {
    ipcRenderer.send('stop-backups-process');
  },
  getBackupsStatus(): Promise<BackupsStatus> {
    return ipcRenderer.invoke('get-backups-status');
  },
  onBackupsStatusChanged(func: (_: BackupsStatus) => void): () => void {
    const eventName = 'backups-status-changed';
    const callback = (_: unknown, v: BackupsStatus) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  getOrCreateDevice(): ReturnType<typeof getOrCreateDevice> {
    return ipcRenderer.invoke('get-or-create-device');
  },
  renameDevice(deviceName: Parameters<typeof renameDevice>[0]): ReturnType<typeof renameDevice> {
    return ipcRenderer.invoke('rename-device', deviceName);
  },
  devices: {
    getDevices: () => {
      return ipcRenderer.invoke('devices.get-all');
    },
  },
  getBackupsFromDevice: (device: Device, isCurrent?: boolean): ReturnType<typeof getBackupsFromDevice> => {
    return ipcRenderer.invoke('get-backups-from-device', device, isCurrent);
  },
  addBackup(): Promise<void> {
    return ipcRenderer.invoke('add-backup');
  },
  disableBackup(folderId: number): Promise<void> {
    return ipcRenderer.invoke('disable-backup', folderId);
  },
  getLastBackupTimestamp(): Promise<number> {
    return ipcRenderer.invoke('get-last-backup-timestamp');
  },
  onBackupProgress(func: (_: BackupsProgress) => void): () => void {
    const eventName = 'backup-progress';
    const callback = (_: unknown, v: BackupsProgress) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  onBackupDownloadProgress(func: (_: BackupDownloadProgress) => void): () => void {
    const eventName = 'backup-download-progress';
    const callback = (_: unknown, v: BackupDownloadProgress) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  abortDownloadBackups(deviceUuid: string) {
    ipcRenderer.send('abort-download-backups-' + deviceUuid, deviceUuid);
  },
  getItemByFolderUuid(folderUuid: string): Promise<ItemBackup[]> {
    return ipcRenderer.invoke('get-item-by-folder-uuid', folderUuid);
  },
  onRemoteSyncStatusChange(callback: (status: RemoteSyncStatus) => void): () => void {
    const eventName = 'remote-sync-status-change';
    const callbackWrapper = (_: unknown, v: RemoteSyncStatus) => callback(v);
    ipcRenderer.on(eventName, callbackWrapper);
    return () => ipcRenderer.removeListener(eventName, callbackWrapper);
  },
  antivirus: {
    isAvailable(): Promise<boolean> {
      return ipcRenderer.invoke('antivirus:is-available');
    },
    scanItems(paths?: SelectedItemToScanProps[]): Promise<void> {
      return ipcRenderer.invoke('antivirus:scan-items', paths);
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
    removeScanProgressListener() {
      ipcRenderer.removeAllListeners('antivirus:scan-progress');
    },
    addItemsToScan: (
      getFiles: boolean,
    ): Promise<
      | {
          path: string;
          itemName: string;
          isDirectory: boolean;
        }[]
      | undefined
    > => {
      return ipcRenderer.invoke('antivirus:add-items-to-scan', getFiles);
    },
    removeInfectedFiles: (infectedFiles: string[]): Promise<void> => {
      return ipcRenderer.invoke('antivirus:remove-infected-files', infectedFiles);
    },
    cancelScan(): Promise<void> {
      return ipcRenderer.invoke('antivirus:cancel-scan');
    },
  },
  path,
  shellOpenExternal: shell.openExternal,
  shellOpenPath: shell.openPath,
  getLastBackupProgress: async () => await ipcPreloadRenderer.invoke('getLastBackupProgress'),
  getUsage: async () => await ipcPreloadRenderer.invoke('getUsage'),
  getAvailableProducts: async () => await ipcPreloadRenderer.invoke('getAvailableProducts'),
  cleanerGenerateReport: async (props) => await ipcPreloadRenderer.invoke('cleanerGenerateReport', props),
  cleanerStartCleanup: async (props) => await ipcPreloadRenderer.invoke('cleanerStartCleanup', props),
  cleanerGetDiskSpace: async () => await ipcPreloadRenderer.invoke('cleanerGetDiskSpace'),
  cleanerStopCleanup: async () => await ipcPreloadRenderer.invoke('cleanerStopCleanup'),
  getTheme: async () => await ipcPreloadRenderer.invoke('getTheme'),
  cleanerOnProgress: (callback: (progressData: CleanupProgress) => void) => {
    const eventName = 'cleaner:cleanup-progress';
    const callbackWrapper = (_: unknown, progressData: CleanupProgress) => callback(progressData);
    ipcRenderer.on(eventName, callbackWrapper);
    return () => {
      ipcRenderer.removeListener(eventName, callbackWrapper);
    };
  },
  openLogs: async () => await ipcPreloadRenderer.invoke('openLogs'),
  getLanguage: async () => await ipcPreloadRenderer.invoke('getLanguage'),
  setConfigKey: async (props) => await ipcPreloadRenderer.invoke('setConfigKey', props),
  driveGetSyncRoot: async () => await ipcPreloadRenderer.invoke('driveGetSyncRoot'),
  driveChooseSyncRootWithDialog: async () => await ipcPreloadRenderer.invoke('driveChooseSyncRootWithDialog'),
  driveOpenSyncRootFolder: async () => await ipcPreloadRenderer.invoke('driveOpenSyncRootFolder'),
  downloadBackup: async (props) => await ipcPreloadRenderer.invoke('downloadBackup', props),
  openLoginUrl: async () => await ipcPreloadRenderer.invoke('openLoginUrl'),
  getRemoteSyncStatus: async () => await ipcPreloadRenderer.invoke('getRemoteSyncStatus'),
  syncManually: async () => await ipcPreloadRenderer.invoke('syncManually'),

  deleteBackupsFromDevice: async (props) => await ipcPreloadRenderer.invoke('deleteBackupsFromDevice', props),
  backupsSetInterval: async (props) => await ipcPreloadRenderer.invoke('backupsSetInterval', props),
  backupsStartProcess: async (props) => await ipcPreloadRenderer.invoke('backupsStartProcess', props),
} satisfies FromProcess & Record<string, unknown>;

contextBridge.exposeInMainWorld('electron', api);

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    electron: typeof api;
  }
}
