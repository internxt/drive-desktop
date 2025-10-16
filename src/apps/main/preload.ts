import { logger, TLoggerBody } from '@internxt/drive-desktop-core/build/backend';
import { contextBridge, ipcRenderer } from 'electron';
import path from 'node:path';
import { RemoteSyncStatus } from './remote-sync/helpers';
import { setConfigKey, StoredValues } from './config/service';
import { SelectedItemToScanProps } from './antivirus/antivirus-clam-av';
import { AccessResponse } from '../renderer/pages/Login/types';
import { getUser } from './auth/service';
import { ProcessInfoUpdatePayload } from '../shared/types';
import { Issue } from './background-processes/issues';
import { BackupsStatus } from './background-processes/backups/BackupsProcessStatus/BackupsStatus';
import { changeBackupPath, Device, getOrCreateDevice, getPathFromDialog, renameDevice } from './device/service';
import { chooseSyncRootWithDialog } from './virtual-root-folder/service';
import { BackupInfo } from '../backups/BackupInfo';
import { BackupsProgress } from './background-processes/backups/types/BackupsProgress';
import { ItemBackup } from '../shared/types/items';
import { getBackupsFromDevice } from './device/get-backups-from-device';
import { ipcPreloadRenderer } from './preload/ipc-renderer';
import { FromProcess } from './preload/ipc';
import { CleanupProgress } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';

const api = {
  getConfigKey(key: StoredValues) {
    return ipcRenderer.invoke('get-config-key', key);
  },
  setConfigKey(props: Parameters<typeof setConfigKey>[0]) {
    ipcRenderer.send('set-config-key', props);
  },
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
  pathChanged(pathname: string) {
    ipcRenderer.send('path-changed', pathname);
  },
  userLoggedIn(data: AccessResponse) {
    ipcRenderer.send('user-logged-in', data);
  },
  isUserLoggedIn(): Promise<boolean> {
    return ipcRenderer.invoke('is-user-logged-in');
  },
  onUserLoggedInChanged(func: (_: boolean) => void) {
    ipcRenderer.on('user-logged-in-changed', (_, v) => func(v));
  },
  userLogginFailed(email: string) {
    ipcRenderer.send('USER_LOGIN_FAILED', email);
  },
  logout() {
    ipcRenderer.send('USER_LOGGED_OUT');
  },
  closeWindow() {
    ipcRenderer.send('user-closed-window');
  },
  minimizeWindow() {
    ipcRenderer.send('user-minimized-window');
  },
  openVirtualDriveFolder(): Promise<void> {
    return ipcRenderer.invoke('open-virtual-drive-folder');
  },
  quit() {
    ipcRenderer.send('user-quit');
  },
  getUser(): Promise<ReturnType<typeof getUser>> {
    return ipcRenderer.invoke('get-user');
  },
  startSyncProcess() {
    ipcRenderer.send('start-sync-process');
  },
  stopSyncProcess() {
    ipcRenderer.send('stop-sync-process');
  },
  getSyncStatus() {
    return ipcRenderer.invoke('get-sync-status');
  },
  onSyncInfoUpdate(func: (_: ProcessInfoUpdatePayload) => void): () => void {
    const eventName = 'sync-info-update';
    const callback = (_: unknown, v: ProcessInfoUpdatePayload) => func(v);
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
  setBackupsInterval(value: number): Promise<void> {
    return ipcRenderer.invoke('set-backups-interval', value);
  },
  startBackupsProcess() {
    ipcRenderer.send('start-backups-process');
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
  chooseSyncRootWithDialog(): ReturnType<typeof chooseSyncRootWithDialog> {
    return ipcRenderer.invoke('choose-sync-root-with-dialog');
  },
  getOrCreateDevice(): ReturnType<typeof getOrCreateDevice> {
    return ipcRenderer.invoke('get-or-create-device');
  },
  renameDevice(deviceName: Parameters<typeof renameDevice>[0]): ReturnType<typeof renameDevice> {
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
  getBackupsFromDevice: (device: Device, isCurrent?: boolean): ReturnType<typeof getBackupsFromDevice> => {
    return ipcRenderer.invoke('get-backups-from-device', device, isCurrent);
  },
  addBackup(): Promise<void> {
    return ipcRenderer.invoke('add-backup');
  },
  addBackupsFromLocalPaths(localPaths: string[]): Promise<void> {
    return ipcRenderer.invoke('add-multiple-backups', localPaths);
  },
  deleteBackup(backup: BackupInfo): Promise<void> {
    return ipcRenderer.invoke('delete-backup', backup);
  },
  deleteBackupsFromDevice(device: Device, isCurrent?: boolean): Promise<void> {
    return ipcRenderer.invoke('delete-backups-from-device', device, isCurrent);
  },
  disableBackup(backup: BackupInfo): Promise<void> {
    return ipcRenderer.invoke('disable-backup', backup);
  },
  getBackupsEnabled(): Promise<boolean> {
    return ipcRenderer.invoke('get-backups-enabled');
  },
  toggleBackupsEnabled(): Promise<void> {
    return ipcRenderer.invoke('toggle-backups-enabled');
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
  onBackupDownloadProgress(func: (_: { id: string; progress: number }) => void): () => void {
    const eventName = 'backup-download-progress';
    const callback = (_: unknown, v: { id: string; progress: number }) => func(v);
    ipcRenderer.on(eventName, callback);
    return () => ipcRenderer.removeListener(eventName, callback);
  },
  abortDownloadBackups(deviceUuid: string) {
    ipcRenderer.send('abort-download-backups-' + deviceUuid, deviceUuid);
  },
  getItemByFolderUuid(folderUuid: string): Promise<ItemBackup[]> {
    return ipcRenderer.invoke('get-item-by-folder-uuid', folderUuid);
  },
  downloadBackup(backup: Device, folderUuids?: string[]): Promise<void> {
    return ipcRenderer.invoke('download-backup', backup, folderUuids);
  },
  changeBackupPath(currentPath: string): ReturnType<typeof changeBackupPath> {
    return ipcRenderer.invoke('change-backup-path', currentPath);
  },
  getFolderPath(): ReturnType<typeof getPathFromDialog> {
    return ipcRenderer.invoke('get-folder-path');
  },
  onRemoteSyncStatusChange(callback: (status: RemoteSyncStatus) => void): () => void {
    const eventName = 'remote-sync-status-change';
    const callbackWrapper = (_: unknown, v: RemoteSyncStatus) => callback(v);
    ipcRenderer.on(eventName, callbackWrapper);
    return () => ipcRenderer.removeListener(eventName, callbackWrapper);
  },
  getRemoteSyncStatus(): Promise<RemoteSyncStatus> {
    return ipcRenderer.invoke('get-remote-sync-status');
  },
  openUrl: (url: string): Promise<void> => {
    return ipcRenderer.invoke('open-url', url);
  },
  getPreferredAppLanguage(): Promise<string[]> {
    return ipcRenderer.invoke('APP:PREFERRED_LANGUAGE');
  },
  syncManually(): Promise<void> {
    return ipcRenderer.invoke('SYNC_MANUALLY');
  },
  getUnsycFileInSyncEngine(): Promise<string[]> {
    return ipcRenderer.invoke('GET_UNSYNC_FILE_IN_SYNC_ENGINE');
  },
  getRecentlywasSyncing(): Promise<boolean> {
    return ipcRenderer.invoke('CHECK_SYNC_IN_PROGRESS');
  },
  user: {
    hasDiscoveredBackups(): Promise<boolean> {
      return ipcRenderer.invoke('user.get-has-discovered-backups');
    },
    discoveredBackups() {
      ipcRenderer.send('user.set-has-discovered-backups');
    },
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
  authAccess: async (props) => await ipcPreloadRenderer.invoke('authAccess', props),
  authLogin: async (props) => await ipcPreloadRenderer.invoke('authLogin', props),
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
} satisfies FromProcess & Record<string, unknown>;

contextBridge.exposeInMainWorld('electron', api);

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    electron: typeof api;
  }
}
