import Logger from 'electron-log';
import { AllParentFoldersStatusIsExists } from '../../folders/application/AllParentFoldersStatusIsExists';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { FileStatuses } from '../domain/FileStatus';
import { SyncFileMessenger } from '../domain/SyncFileMessenger';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';

export class FileDeleter {
  constructor(
    private readonly remote: RemoteFileSystem,
    private readonly local: LocalFileSystem,
    private readonly repository: FileRepository,
    private readonly allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists,
    private readonly notifier: SyncFileMessenger
  ) {}

  async run(contentsId: File['contentsId']): Promise<void> {
    const file = await this.repository.searchByContentsId(contentsId);

    if (!file) {
      return;
    }

    if (file.status.is(FileStatuses.TRASHED)) {
      Logger.warn(`File ${file.path} is already trashed. Will ignore...`);
      return;
    }

    const allParentsExists = await this.allParentFoldersStatusIsExists.run(
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
      await this.repository.update(file);
      await this.notifier.trashed(file.name, file.type, file.size);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      Logger.error('[File Deleter]', message);

      const cause =
        error instanceof DriveDesktopError ? error.syncErrorCause : 'UNKNOWN';

      this.notifier.errorWhileTrashing(file.name, file.type, cause);

      // TODO: add an event and an event handler to recreate placeholders if needed
      this.local.createPlaceHolder(file);

      throw error;
    }
  }
}
