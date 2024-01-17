import Logger from 'electron-log';
import { AllParentFoldersStatusIsExists } from '../../folders/application/AllParentFoldersStatusIsExists';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { FileStatuses } from '../domain/FileStatus';
import { SyncFileMessenger } from '../domain/SyncFileMessenger';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';

export class FileDeleter {
  constructor(
    private readonly remote: RemoteFileSystem,
    private readonly local: LocalFileSystem,
    private readonly repository: FileRepository,
    private readonly allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists,
    private readonly notifier: SyncFileMessenger
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
    await this.notifier.trashing(file.name, file.type, file.size);

    try {
      file.trash();

      await this.remote.trash(file.contentsId);
      await this.repository.delete(file.contentsId);
      await this.notifier.trashed(file.name, file.type, file.size);
    } catch (error: unknown) {
      Logger.error(
        `Error deleting the file ${file.nameWithExtension}: `,
        error
      );

      const message = error instanceof Error ? error.message : 'Unknown error';

      this.notifier.errorWhileTrashing(file.name, file.type, message);
      this.local.createPlaceHolder(file);

      throw error;
    }
  }
}
