import Logger from 'electron-log';
import { AllParentFoldersStatusIsExists } from '../../folders/application/AllParentFoldersStatusIsExists';
import { FileStatuses } from '../domain/FileStatus';
import { File } from '../domain/File';
import { SyncEngineIpc } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { Service } from 'diod';
import { NodeWinLocalFileSystem } from '../infrastructure/NodeWinLocalFileSystem';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { HttpRemoteFileSystem } from '../infrastructure/HttpRemoteFileSystem';

@Service()
export class FileDeleter {
  constructor(
    private readonly remote: HttpRemoteFileSystem,
    private readonly local: NodeWinLocalFileSystem,
    private readonly repository: InMemoryFileRepository,
    private readonly allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists,
    private readonly ipc: SyncEngineIpc,
  ) {}

  async run(contentsId: File['contentsId']): Promise<void> {
    const file = this.repository.searchByPartial({ contentsId });

    if (!file) {
      return;
    }

    if (file.status.is(FileStatuses.TRASHED)) {
      Logger.warn(`File ${file.path} is already trashed. Will ignore...`);
      return;
    }

    const allParentsExists = this.allParentFoldersStatusIsExists.run(file.folderId.value);

    if (!allParentsExists) {
      Logger.warn(`Skipped file deletion for ${file.path}. A folder in a higher level is already marked as trashed`);
      return;
    }

    this.ipc.send('FILE_DELETING', {
      name: file.name,
      extension: file.type,
      nameWithExtension: file.nameWithExtension,
      size: file.size,
    });

    try {
      file.trash();

      await this.remote.delete(file);
      await this.repository.update(file);

      this.ipc.send('FILE_DELETED', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        size: file.size,
      });
    } catch (error: unknown) {
      Logger.error(`Error deleting the file ${file.nameWithExtension}: `, error);

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.local.createPlaceHolder(file);
      this.ipc.send('FILE_DELETION_ERROR', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        error: message,
      });

      this.ipc.send('SYNC_INFO_UPDATE', {
        kind: 'REMOTE',
        name: file.nameWithExtension,
        action: 'DELETE_ERROR',
        errorName: 'BAD_RESPONSE',
        process: 'SYNC',
      });
    }
  }
}
