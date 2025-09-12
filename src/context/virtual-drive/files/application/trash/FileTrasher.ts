import { Service } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { DriveDesktopError } from '../../../../shared/domain/errors/DriveDesktopError';
import { AllParentFoldersStatusIsExists } from '../../../folders/application/AllParentFoldersStatusIsExists';
import { File } from '../../domain/File';
import { FileRepository } from '../../domain/FileRepository';
import { FileStatuses } from '../../domain/FileStatus';
import { SyncFileMessenger } from '../../domain/SyncFileMessenger';
import { RemoteFileSystem } from '../../domain/file-systems/RemoteFileSystem';

@Service()
export class FileTrasher {
  constructor(
    private readonly remote: RemoteFileSystem,
    private readonly repository: FileRepository,
    private readonly allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists,
    private readonly notifier: SyncFileMessenger
  ) {}

  async run(contentsId: File['contentsId']): Promise<void> {
    const file = this.repository
      .matchingPartial({
        contentsId,
        status: FileStatuses.EXISTS,
      })
      .at(0);

    if (!file) {
      return;
    }

    if (file.status.is(FileStatuses.TRASHED)) {
      logger.warn({ msg: `File ${file.path} is already trashed. Will ignore...` });
      return;
    }

    const allParentsExists = await this.allParentFoldersStatusIsExists.run(
      file.folderId
    );

    if (!allParentsExists) {
      logger.warn({
        msg: `Skipped file deletion for ${file.path}. A folder in a higher level is already marked as trashed`
      });
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

      logger.error({ msg: '[File Deleter]', error: message });

      const cause =
        error instanceof DriveDesktopError ? error.cause : 'UNKNOWN';

      await this.notifier.issues({
        error: 'DELETE_ERROR',
        cause,
        name: file.nameWithExtension,
      });

      throw error;
    }
  }
}
