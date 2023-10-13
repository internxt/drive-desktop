import Logger from 'electron-log';
import { SyncEngineIpc } from '../../../ipcRendererSyncEngine';
import { AllParentFoldersStatusIsExists } from '../../folders/application/AllParentFoldersStatusIsExists';
import { FileRepository } from '../domain/FileRepository';
import { FileStatuses } from '../domain/FileStatus';
import { PlaceholderCreator } from '../../placeholders/domain/PlaceholderCreator';
import { File } from '../domain/File';

export class FileDeleter {
  constructor(
    private readonly repository: FileRepository,
    private readonly allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists,
    private readonly placeholderCreator: PlaceholderCreator,
    private readonly ipc: SyncEngineIpc
  ) {}

  async run(contentsId: string): Promise<void> {
    const file = this.repository.searchByPartial({ contentsId });

    if (!file) {
      return;
    }

    await this.act(file);
  }

  async act(file: File) {
    if (file.status.is(FileStatuses.TRASHED)) {
      Logger.warn(`File ${file.path.value} is already trashed. Will ignore...`);
      return;
    }

    const allParentsExists = this.allParentFoldersStatusIsExists.run(
      file.folderId
    );

    if (!allParentsExists) {
      Logger.warn(
        `Skipped file deletion for ${file.path.value}. A folder in a higher level is already marked as trashed`
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

      await this.repository.delete(file);

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

      this.placeholderCreator.file(file);
    }
  }
}
