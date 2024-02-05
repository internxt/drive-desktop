import { SyncEngineIpc } from '../../../../../apps/sync-engine/SyncEngineIpc';
import { SyncMessenger } from '../../../../shared/domain/SyncMessenger';
import { SyncFolderMessenger } from '../../domain/SyncFolderMessenger';

export class BackgroundProcessSyncFolderMessenger
  extends SyncMessenger
  implements SyncFolderMessenger
{
  constructor(private readonly ipc: SyncEngineIpc) {
    super();
  }

  async creating(currentName: string): Promise<void> {
    this.ipc.send('FOLDER_CREATING', { name: currentName });
  }

  async created(currentName: string): Promise<void> {
    this.ipc.send('FOLDER_CREATED', { name: currentName });
  }

  async errorWhileCreating(
    currentName: string,
    message: string
  ): Promise<void> {
    this.ipc.send('FOLDER_CREATION_ERROR', {
      name: currentName,
      error: message,
    });
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

  async errorWhileRenaming(
    currentName: string,
    desiredName: string,
    message: string
  ): Promise<void> {
    this.ipc.send('FOLDER_RENAME_ERROR', {
      oldName: currentName,
      newName: desiredName,
      error: message,
    });
  }

  async errorWhileTrashing(_name: string): Promise<void> {
    // TODO: implement
  }
}
