import { ipcMain } from 'electron';
import { existsSync } from 'node:fs';
import { broadcastToWindows } from '../windows';
import { showNotEnoughSpaceNotification } from './process-issues';

type UploadIssueError = 'UPLOAD_FAILED' | 'FILE_NOT_READY';

export type SyncIssue = {
  tab: 'sync';
  name: string;
  error:
    | 'INVALID_WINDOWS_NAME'
    | 'FILE_SIZE_TOO_BIG'
    | 'CANNOT_REGISTER_VIRTUAL_DRIVE'
    | 'EMPTY_FILES_NOT_ALLOWED'
    | 'EMPTY_FILES_EXCEEDED'
    | UploadIssueError;
};

export type BackupsIssue = {
  tab: 'backups';
  name: string;
  folderUuid: string;
  error: 'FILE_SIZE_TOO_BIG' | 'FOLDER_ACCESS_DENIED' | UploadIssueError;
};

export type GeneralIssue = {
  tab: 'general';
  name: string;
  error: 'NOT_ENOUGH_SPACE' | 'WEBSOCKET_CONNECTION_ERROR' | 'NETWORK_CONNECTIVITY_ERROR' | 'SERVER_INTERNAL_ERROR';
};

export type Issue = SyncIssue | BackupsIssue | GeneralIssue;

export let issues: Issue[] = [];

function onIssuesChanged() {
  broadcastToWindows({ name: 'issues-changed', data: issues });
}

function addIssue(issue: Issue) {
  const exists = issues.some((i) => {
    if (i.tab === 'backups' && issue.tab === 'backups' && i.folderUuid !== issue.folderUuid) return false;
    return i.tab === issue.tab && i.name === issue.name && i.error === issue.error;
  });

  if (!exists) {
    issues.push(issue);
    onIssuesChanged();

    if (issue.error === 'NOT_ENOUGH_SPACE') {
      showNotEnoughSpaceNotification();
    }
  }
}

export function addBackupsIssue(issue: Omit<BackupsIssue, 'tab'>) {
  addIssue({ tab: 'backups', ...issue });
}

export function addSyncIssue(issue: Omit<SyncIssue, 'tab'>) {
  addIssue({ tab: 'sync', ...issue });
}

export function addGeneralIssue(issue: Omit<GeneralIssue, 'tab'>) {
  addIssue({ tab: 'general', ...issue });
}

export function clearIssues() {
  issues = [];
  onIssuesChanged();
}

/**
 * v2.7.0 Victor Fernandez
 * Backup issues are cleared per folder right before it runs, so the folders skipped when a backup is
 * stopped keep the issues of their last run.
 */
export function clearBackupsIssues({ folderUuid }: { folderUuid: string }) {
  issues = issues.filter((i) => i.tab !== 'backups' || i.folderUuid !== folderUuid);
  onIssuesChanged();
}

export function clearInactiveBackupsIssues({ folderUuids }: { folderUuids: string[] }) {
  const activeFolders = new Set(folderUuids);
  issues = issues.filter((i) => i.tab !== 'backups' || activeFolders.has(i.folderUuid));
  onIssuesChanged();
}

export function setupIssueHandlers() {
  ipcMain.handle('get-issues', () => issues);
}

function removeIssue(issue: Issue) {
  const initialLength = issues.length;

  issues = issues.filter((i) => {
    return !(i.tab === issue.tab && i.error === issue.error && i.name === issue.name);
  });

  if (issues.length < initialLength) {
    onIssuesChanged();
  }
}

export function removeSyncIssue(issue: Omit<SyncIssue, 'tab'>) {
  removeIssue({ ...issue, tab: 'sync' });
}

function isUploadIssue(issue: Issue) {
  return issue.tab !== 'general' && (issue.error === 'UPLOAD_FAILED' || issue.error === 'FILE_NOT_READY');
}

function isSyncUploadIssue(issue: Issue) {
  return issue.tab === 'sync' && isUploadIssue(issue);
}

export function countBackupUploadIssues({ folderUuid }: { folderUuid: string }) {
  return issues.filter((i) => i.tab === 'backups' && i.folderUuid === folderUuid && isUploadIssue(i)).length;
}

/**
 * v2.7.0 Victor Fernandez
 * An upload issue stays until the file is uploaded, so a file only shows its latest upload problem.
 * Removing also drops the upload issues of files that no longer exist: a moved or renamed file reaches
 * us as a create event on the new path, so we cannot rely on a delete event to clear the old one.
 * Adding does not check the disk, so a burst of failed uploads does not stat every pending file.
 */
export function setUploadIssue({ path, error }: { path: string; error: UploadIssueError }) {
  issues = issues.filter((i) => !isSyncUploadIssue(i) || i.name !== path || i.error === error);
  addSyncIssue({ name: path, error });
}

export function removeUploadIssues({ path }: { path: string }) {
  const initialLength = issues.length;

  issues = issues.filter((i) => {
    if (!isSyncUploadIssue(i)) return true;
    return i.name !== path && existsSync(i.name);
  });

  if (issues.length < initialLength) onIssuesChanged();
}

export function removeGeneralIssue(issue: Omit<GeneralIssue, 'tab'>) {
  removeIssue({ ...issue, tab: 'general' });
}
