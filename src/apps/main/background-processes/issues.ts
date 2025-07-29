import { ipcMain } from 'electron';
import { ipcMainSyncEngine } from '@/apps/sync-engine/ipcMainSyncEngine';
import { IssuesModule } from '@internxt/drive-desktop-core/build/backend';

export function setupIssueHandlers() {
  ipcMainSyncEngine.on('ADD_SYNC_ISSUE', (_, issue) => IssuesModule.addSyncIssue(issue));
  ipcMainSyncEngine.on('ADD_GENERAL_ISSUE', (_, issue) => IssuesModule.addGeneralIssue(issue));
  ipcMain.handle('get-issues', () => IssuesModule.issues);
}
