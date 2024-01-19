import { ipcMain } from 'electron';

import eventBus from '../event-bus';
import { broadcastToWindows } from '../windows';
import { VirtualDriveIssue } from '../../../shared/issues/VirtualDriveIssue';

let virtualDriveIssues: VirtualDriveIssue[] = [];

function getVirtualDriveIssues() {
  return virtualDriveIssues;
}

function onProcessIssuesChanged() {
  broadcastToWindows('process-issues-changed', getVirtualDriveIssues);
}

export function clearSyncIssues() {
  virtualDriveIssues = [];
  onProcessIssuesChanged();
}
export function clearBackupsIssues() {
  // no-op
}

export function addVirtualDrive(issue: VirtualDriveIssue) {
  virtualDriveIssues.push(issue);
  onProcessIssuesChanged();
}

ipcMain.on('SYNC_PROBLEM', (_, payload) => {
  addVirtualDrive({
    action: 'GENERATE_TREE',
    errorName: 'DUPLICATED_NODE',
    node: payload.additionalData.name,
  });
});

ipcMain.on('BACKUP_ISSUE', (_, issue: VirtualDriveIssue) => {
  addVirtualDrive(issue);
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
