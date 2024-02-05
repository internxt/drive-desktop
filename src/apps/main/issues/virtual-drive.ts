import eventBus from '../event-bus';
import { broadcastToWindows } from '../windows';
import { VirtualDriveIssue } from '../../../shared/issues/VirtualDriveIssue';
import { MainProcessSyncEngineIPC } from '../MainProcessSyncEngineIPC';
import { ipcMain } from 'electron';

let virtualDriveIssues: VirtualDriveIssue[] = [];

function getVirtualDriveIssues() {
  return virtualDriveIssues;
}

function onProcessIssuesChanged() {
  broadcastToWindows('process-issues-changed', getVirtualDriveIssues());
}

export function clearSyncIssues() {
  virtualDriveIssues = [];
  onProcessIssuesChanged();
}
export function clearBackupsIssues() {
  // no-op
}

export function addVirtualDriveIssue(issue: VirtualDriveIssue) {
  virtualDriveIssues.push(issue);
  onProcessIssuesChanged();
}

MainProcessSyncEngineIPC.on('FILE_UPLOAD_ERROR', (_, payload) => {
  addVirtualDriveIssue({
    error: 'UPLOAD_ERROR',
    cause: payload.cause,
    name: payload.nameWithExtension,
  });
});

MainProcessSyncEngineIPC.on('FILE_DOWNLOAD_ERROR', (_, payload) => {
  const { nameWithExtension } = payload;

  addVirtualDriveIssue({
    error: 'DOWNLOAD_ERROR',
    cause: payload.cause,
    name: nameWithExtension,
  });
});

MainProcessSyncEngineIPC.on('FILE_RENAME_ERROR', (_, payload) => {
  const { nameWithExtension } = payload;

  addVirtualDriveIssue({
    error: 'RENAME_ERROR',
    cause: payload.cause,
    name: nameWithExtension,
  });
});

MainProcessSyncEngineIPC.on('FILE_DELETION_ERROR', (_, payload) => {
  const { nameWithExtension } = payload;

  addVirtualDriveIssue({
    error: 'DELETE_ERROR',
    cause: payload.cause,
    name: nameWithExtension,
  });
});

ipcMain.handle('get.issues.virtual-drive', getVirtualDriveIssues);

eventBus.on('USER_LOGGED_OUT', () => {
  clearSyncIssues();
  clearBackupsIssues();
});

eventBus.on('USER_WAS_UNAUTHORIZED', () => {
  clearSyncIssues();
  clearBackupsIssues();
});
