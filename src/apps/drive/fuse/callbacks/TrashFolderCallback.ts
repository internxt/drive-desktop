import { Container } from 'diod';
import { basename } from 'path';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { FolderDeleter } from '../../../../context/virtual-drive/folders/application/FolderDeleter';
import { SingleFolderMatchingFinder } from '../../../../context/virtual-drive/folders/application/SingleFolderMatchingFinder';
import { FolderStatuses } from '../../../../context/virtual-drive/folders/domain/FolderStatus';
import { SyncFolderMessenger } from '../../../../context/virtual-drive/folders/domain/SyncFolderMessenger';
import { NotifyFuseCallback } from './FuseCallback';

const FOLDER_TRASH_CALLBACK_TIMEOUT_MS = 1_500;

type WaitWithTimeoutPops = {
  promise: Promise<void>;
  timeoutMs: number;
};

async function waitWithTimeout({ promise, timeoutMs }: WaitWithTimeoutPops) {
  const completion = promise.then(() => true);
  const timeout = new Promise<boolean>((resolve) => {
    setTimeout(() => {
      resolve(false);
    }, timeoutMs);
  });

  return Promise.race([completion, timeout]);
}

export class TrashFolderCallback extends NotifyFuseCallback {
  constructor(private readonly container: Container) {
    super('Trash Folder');
  }

  async execute(path: string) {
    try {
      const folder = await this.container.get(SingleFolderMatchingFinder).run({
        path,
        status: FolderStatuses.EXISTS,
      });

      const deletionPromise = this.container.get(FolderDeleter).run(folder.uuid);
      const deletionCompletedInTime = await waitWithTimeout({
        promise: deletionPromise,
        timeoutMs: FOLDER_TRASH_CALLBACK_TIMEOUT_MS,
      });

      if (!deletionCompletedInTime) {
        logger.warn({
          msg: 'Folder deletion exceeded callback timeout. Continuing deletion in background.',
          path,
          timeoutMs: FOLDER_TRASH_CALLBACK_TIMEOUT_MS,
        });

        void deletionPromise.catch(async (error) => {
          logger.error({
            msg: 'Background folder deletion failed after callback timeout',
            path,
            error,
          });

          await this.container.get(SyncFolderMessenger).issue({
            error: 'FOLDER_TRASH_ERROR',
            cause: 'UNKNOWN',
            name: basename(path),
          });
        });
      }

      return this.right();
    } catch (throwed: unknown) {
      await this.container.get(SyncFolderMessenger).issue({
        error: 'FOLDER_TRASH_ERROR',
        cause: 'UNKNOWN',
        name: basename(path),
      });

      return this.left(throwed);
    }
  }
}
