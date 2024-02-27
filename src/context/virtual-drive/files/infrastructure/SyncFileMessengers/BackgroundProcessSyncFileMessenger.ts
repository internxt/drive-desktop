import path from 'path';
import { SyncEngineIpc } from '../../../../../apps/sync-engine/SyncEngineIpc';
import { SyncMessenger } from '../../../../shared/domain/SyncMessenger';
import { SyncFileMessenger } from '../../domain/SyncFileMessenger';
import { SyncErrorCause } from '../../../../../shared/issues/SyncErrorCause';

export class BackgroundProcessSyncFileMessenger
  extends SyncMessenger
  implements SyncFileMessenger
{
  constructor(private readonly ipc: SyncEngineIpc) {
    super();
  }
  async created(name: string, extension: string): Promise<void> {
    this.ipc.send('FILE_CREATED', {
      name,
      extension,
      nameWithExtension: this.nameWithExtension(name, extension),
    });
  }

  async errorWhileCreating(
    name: string,
    extension: string,
    cause: SyncErrorCause
  ): Promise<void> {
    this.ipc.send('FILE_UPLOAD_ERROR', {
      name,
      extension,
      nameWithExtension: this.nameWithExtension(name, extension),
      cause,
    });
  }

  async trashing(name: string, extension: string, size: number): Promise<void> {
    this.ipc.send('FILE_DELETING', {
      name,
      extension,
      nameWithExtension: this.nameWithExtension(name, extension),
      size,
    });
  }

  async trashed(name: string, extension: string, size: number): Promise<void> {
    this.ipc.send('FILE_DELETED', {
      name,
      extension,
      nameWithExtension: this.nameWithExtension(name, extension),
      size,
    });
  }

  async errorWhileTrashing(
    name: string,
    extension: string,
    cause: SyncErrorCause
  ): Promise<void> {
    this.ipc.send('FILE_DELETION_ERROR', {
      name,
      extension,
      nameWithExtension: this.nameWithExtension(name, extension),
      cause,
    });
  }

  async renaming(current: string, desired: string): Promise<void> {
    this.ipc.send('FILE_RENAMING', {
      oldName: current,
      nameWithExtension: desired,
    });
  }

  async renamed(current: string, desired: string): Promise<void> {
    this.ipc.send('FILE_RENAMED', {
      oldName: current,
      nameWithExtension: desired,
    });
  }

  async errorWhileRenaming(
    current: string,
    _desired: string,
    cause: SyncErrorCause
  ): Promise<void> {
    const extension = path.extname(current);

    const name = current.replace(`.${extension}`, '');

    this.ipc.send('FILE_RENAME_ERROR', {
      name,
      extension,
      nameWithExtension: current,
      cause,
    });
  }
}
