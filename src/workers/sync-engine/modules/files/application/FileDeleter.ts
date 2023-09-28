import Logger from 'electron-log';
import { SyncEngineIpc } from '../../../ipcRendererSyncEngine';
import { ParentFoldersExistForDeletion } from '../../folders/application/ParentFoldersExistForDeletion';
import { FileRepository } from '../domain/FileRepository';
import { FileStatuses } from '../domain/FileStatus';
import { FileFinderByContentsId } from './FileFinderByContentsId';
import { FilePlaceholderCreator } from '../infrastructure/FilePlaceholderCreator';

export class FileDeleter {
  constructor(
    private readonly repository: FileRepository,
    private readonly fileFinder: FileFinderByContentsId,
    private readonly parentFoldersExistForDeletion: ParentFoldersExistForDeletion,
    // TODO: don't import it directly from infrastructure
    private readonly filePlaceholderCreator: FilePlaceholderCreator,
    private readonly ipc: SyncEngineIpc
  ) {}

  async run(contentsId: string): Promise<void> {
    const file = this.fileFinder.run(contentsId);

    if (file.status.is(FileStatuses.TRASHED)) {
      Logger.warn(`File ${file.path.value} is already trashed. Will ignore...`);
      return;
    }

    const allParentsExists = this.parentFoldersExistForDeletion.run(
      file.folderId
    );

    if (!allParentsExists) {
      Logger.warn(
        `Skipped file deletion for ${file.path.value}. A folder in a higher level is already marked as trashed`
      );
      return;
    }

    this.ipc.send('DELETING_FILE', {
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

      this.filePlaceholderCreator.run(file);
    }
  }
}
