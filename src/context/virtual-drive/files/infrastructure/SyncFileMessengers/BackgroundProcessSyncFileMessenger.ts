import path from 'path';
import { SyncEngineIpc } from '../../../../../apps/sync-engine/SyncEngineIpc';
import { SyncMessenger } from '../../../../shared/domain/SyncMessenger';
import { SyncFileMessenger } from '../../domain/SyncFileMessenger';
import { VirtualDriveFileIssue } from '../../../../../shared/issues/VirtualDriveIssue';
import { VirtualDriveFileError } from '../../../../../shared/issues/VirtualDriveError';
import { FileErrorEvents } from '../../../../../apps/shared/IPC/events/virtualDrive/backgroundEvents/files';

const virtualDriveFileErrorToFileErrorKeyMap: Record<
  VirtualDriveFileError,
  keyof FileErrorEvents
> = {
  UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  DOWNLOAD_ERROR: 'FILE_DOWNLOAD_ERROR',
  RENAME_ERROR: 'FILE_RENAME_ERROR',
  DELETE_ERROR: 'FILE_DELETION_ERROR',
  METADATA_READ_ERROR: 'FILE_UPLOAD_ERROR',
  GENERATE_TREE: 'FILE_DOWNLOAD_ERROR',
};

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

  async issues(issue: VirtualDriveFileIssue): Promise<void> {
    const event = virtualDriveFileErrorToFileErrorKeyMap[issue.error];

    this.ipc.send(event, {
      name: path.basename(issue.name, path.extname(issue.name)),
      extension: path.extname(issue.name),
      nameWithExtension: issue.name,
      cause: issue.cause,
    });
  }
}
