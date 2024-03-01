import { SyncEngineIpc } from '../../../../../apps/sync-engine/SyncEngineIpc';
import { VirtualDriveFolderIssue } from '../../../../../shared/issues/VirtualDriveIssue';
import { SyncFolderMessenger } from '../../domain/SyncFolderMessenger';

export class BackgroundProcessSyncFolderMessenger
  implements SyncFolderMessenger
{
  constructor(private readonly ipc: SyncEngineIpc) {}

  async creating(currentName: string): Promise<void> {
    this.ipc.send('FOLDER_CREATING', { name: currentName });
  }

  async created(currentName: string): Promise<void> {
    this.ipc.send('FOLDER_CREATED', { name: currentName });
  }

  async rename(currentName: string, desiredName: string): Promise<void> {
    this.ipc.send('FOLDER_RENAMING', {
      oldName: currentName,
      newName: desiredName,
    });
  }

  async renamed(currentName: string, desiredName: string): Promise<void> {
    this.ipc.send('FOLDER_RENAMED', {
      oldName: currentName,
      newName: desiredName,
    });
  }

  async issue(_issue: VirtualDriveFolderIssue): Promise<void> {
    // TODO: implement
  }
}
