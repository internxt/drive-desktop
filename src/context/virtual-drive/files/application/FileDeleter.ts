import Logger from 'electron-log';
import { AllParentFoldersStatusIsExists } from '../../folders/application/AllParentFoldersStatusIsExists';
import { FileStatuses } from '../domain/FileStatus';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';
import { SyncEngineIpc } from '../../../../apps/sync-engine/ipcRendererSyncEngine';

export class FileDeleter {
  constructor(
    private readonly remote: RemoteFileSystem,
    private readonly local: LocalFileSystem,
    private readonly repository: FileRepository,
    private readonly allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists,
    private readonly ipc: SyncEngineIpc
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

    const allParentsExists = this.allParentFoldersStatusIsExists.run(
      file.folderId
    );

    if (!allParentsExists) {
      Logger.warn(
        `Skipped file deletion for ${file.path}. A folder in a higher level is already marked as trashed`
      );
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

      await this.remote.trash(file.contentsId);
      await this.repository.update(file);

      this.ipc.send('FILE_DELETED', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        size: file.size,
      });
    } catch (error: unknown) {
      Logger.error(
        `Error deleting the file ${file.nameWithExtension}: `,
        error
      );

      const message = error instanceof Error ? error.message : 'Unknown error';

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

      this.local.createPlaceHolder(file);
    }
  }
}
