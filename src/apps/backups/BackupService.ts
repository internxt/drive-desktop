import { Environment } from '@internxt/inxt-js';
import { Service } from 'diod';
import { executeAsyncQueue } from '../../backend/common/async-queue/execute-async-queue';
import {
  createBackupUpdateExecutor,
  ModifiedFilePair,
} from '../../backend/features/backup/upload/create-backup-update-executor';
import { DEFAULT_CONCURRENCY } from '../../backend/features/backup/upload/constants';
import { LocalFile } from '../../context/local/localFile/domain/LocalFile';
import { AbsolutePath } from '../../context/local/localFile/infrastructure/AbsolutePath';
import { LocalTree } from '../../context/local/localTree/domain/LocalTree';
import { File } from '../../context/virtual-drive/files/domain/File';
import { SimpleFolderCreator } from '../../context/virtual-drive/folders/application/create/SimpleFolderCreator';
import { RemoteTreeBuilder } from '../../context/virtual-drive/remoteTree/application/RemoteTreeBuilder';
import { RemoteTree } from '../../context/virtual-drive/remoteTree/domain/RemoteTree';
import { BackupInfo } from './BackupInfo';
import { DiffFilesCalculatorService, FilesDiff } from './diff/DiffFilesCalculatorService';
import { FoldersDiff, FoldersDiffCalculator } from './diff/FoldersDiffCalculator';
import { relative } from './utils/relative';
import { DriveDesktopError } from '../../context/shared/domain/errors/DriveDesktopError';
import { RetryOptions } from '../shared/retry/types';
import { RetryHandler } from '../shared/retry/RetryHandler';
import { UsageModule } from '../../backend/features/usage/usage.module';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { BackupProgressTracker } from '../../backend/features/backup/backup-progress-tracker';
import { RetryError } from '../shared/retry/RetryError';
import { Either, left, right } from '../../context/shared/domain/Either';
import { addFileToTrash } from '../../infra/drive-server/services/files/services/add-file-to-trash';
import { createBackupUploadExecutor } from '../../backend/features/backup/upload/create-backup-upload-executor';
import { backupErrorsTracker } from '../../backend/features/backup';
import { buildLocalTree } from '../../backend/features/backup/local-tree';

@Service()
export class BackupService {
  constructor(
    private readonly remoteTreeBuilder: RemoteTreeBuilder,
    private readonly simpleFolderCreator: SimpleFolderCreator,
    private readonly environment: Environment,
    private readonly bucket: string,
  ) {}

  // TODO: PB-3897 - Change Signature of this method for a better error handling
  async run(
    info: BackupInfo,
    signal: AbortSignal,
    tracker: BackupProgressTracker,
  ): Promise<DriveDesktopError | undefined> {
    logger.debug({ tag: 'BACKUPS', msg: 'Starting backup for:', pathname: info.pathname });

    try {
      logger.debug({ tag: 'BACKUPS', msg: 'Generating local tree' });
      const { data, error } = await buildLocalTree(info.pathname as AbsolutePath);
      if (error) {
        logger.error({ tag: 'BACKUPS', msg: 'Error generating local tree:', error });
        return error;
      }
      if (data.skippedItems.length > 0) {
        /** TODO PB-6391:
         * Extend backup issues window to include
         * skipped items details so the issues window can show each skipped path
         */
        backupErrorsTracker.add(info.folderId, {
          name: info.name,
          error: 'ACTION_NOT_PERMITTED',
        });
      }
      const local = data.tree;
      logger.debug({ tag: 'BACKUPS', msg: 'Local tree generated successfully' });

      logger.debug({ tag: 'BACKUPS', msg: 'Generating remote tree' });
      const remote = await this.remoteTreeBuilder.run(info.folderId, info.folderUuid, true);
      logger.debug({ tag: 'BACKUPS', msg: 'Remote tree generated successfully' });

      logger.debug({ tag: 'BACKUPS', msg: 'Calculating folder differences' });
      const foldersDiff = FoldersDiffCalculator.calculate(local, remote);
      logger.debug({ tag: 'BACKUPS', msg: 'Folder differences calculated' });

      logger.debug({ tag: 'BACKUPS', msg: 'Calculating file differences' });
      const filesDiff = DiffFilesCalculatorService.calculate(local, remote);
      logger.debug({ tag: 'BACKUPS', msg: 'File differences calculated' });

      logger.debug({ tag: 'BACKUPS', msg: 'Checking available space' });
      await this.isThereEnoughSpace(filesDiff);
      logger.debug({ tag: 'BACKUPS', msg: 'Space check completed' });

      const emptyAddedFiles = filesDiff.added.filter((f) => f.size === 0).length;
      const itemsAlreadyBacked = filesDiff.unmodified.length + foldersDiff.unmodified.length + emptyAddedFiles;
      tracker.incrementProcessed(itemsAlreadyBacked);

      logger.debug({ tag: 'BACKUPS', msg: 'Starting folder backup' });
      await this.backupFolders(foldersDiff, local, remote, tracker);
      logger.debug({ tag: 'BACKUPS', msg: 'Folder backup completed' });

      logger.debug({ tag: 'BACKUPS', msg: 'Starting file backup' });
      await this.backupFiles(filesDiff, local, remote, signal, tracker);
      logger.debug({ tag: 'BACKUPS', msg: 'File backup completed' });

      logger.debug({ tag: 'BACKUPS', msg: 'Backup process completed successfully' });
      return undefined;
    } catch (error) {
      logger.error({ tag: 'BACKUPS', msg: 'Backup process failed with error:', error });
      if (error instanceof DriveDesktopError) {
        logger.error({ tag: 'BACKUPS', msg: 'DriveDesktopError cause:', cause: error.cause });
        return error;
      }
      return new DriveDesktopError('UNKNOWN', 'An unknown error occurred');
    }
  }

  /**
   * Executes the backup process with retry logic.
   */
  async runWithRetry(
    info: BackupInfo,
    signal: AbortSignal,
    tracker: BackupProgressTracker,
  ): Promise<Either<RetryError | DriveDesktopError, undefined>> {
    const options: RetryOptions = {
      maxRetries: 3,
      initialDelay: 5000,
      backoffFactor: 2,
      jitter: true,
      signal,
    };
    const run = () => this.run(info, signal, tracker);
    const result = await RetryHandler.execute(run, options);
    if (result.isLeft()) {
      return left(result.getLeft());
    }
    const value = result.getRight();
    if (value !== undefined) {
      return left(value);
    }
    return right(undefined);
  }

  private async isThereEnoughSpace(filesDiff: FilesDiff): Promise<void> {
    const bytesToUpload = filesDiff.added.reduce((acc, file) => {
      acc += file.size;

      return acc;
    }, 0);

    const bytesToUpdate = Array.from(filesDiff.modified.entries()).reduce((acc, [local, remote]) => {
      acc += local.size - remote.size;

      return acc;
    }, 0);

    const total = bytesToUpdate + bytesToUpload;

    const validateSpaceResult = await UsageModule.validateSpace(total);
    if (validateSpaceResult.error) {
      throw new DriveDesktopError('BAD_RESPONSE', validateSpaceResult.error.message);
    }
    if (validateSpaceResult.data.hasSpace === false) {
      throw new DriveDesktopError(
        'NOT_ENOUGH_SPACE',
        'The size of the files to upload is greater than the available space',
      );
    }
  }

  private async backupFolders(diff: FoldersDiff, local: LocalTree, remote: RemoteTree, tracker: BackupProgressTracker) {
    logger.debug({ tag: 'BACKUPS', msg: 'Backing folders' });

    logger.debug({ tag: 'BACKUPS', msg: 'Folders added', count: diff.added.length });
    for (const localFolder of diff.added) {
      const remoteParentPath = relative(local.root.path, localFolder.basedir());

      const parentExists = remote.has(remoteParentPath);

      if (!parentExists) {
        continue;
      }

      const parent = remote.getParent(relative(local.root.path, localFolder.path));

      // eslint-disable-next-line no-await-in-loop
      const folder = await this.simpleFolderCreator.run(
        relative(local.root.path, localFolder.path),
        parent.id,
        parent.uuid,
      );

      remote.addFolder(parent, folder);
      tracker.incrementProcessed(1);
    }
  }

  private async backupFiles(
    { added, modified, deleted }: FilesDiff,
    local: LocalTree,
    remote: RemoteTree,
    signal: AbortSignal,
    tracker: BackupProgressTracker,
  ) {
    logger.debug({ tag: 'BACKUPS', msg: 'Backing files' });

    if (added.length > 0) {
      logger.debug({ tag: 'BACKUPS', msg: 'Files added', count: added.length });
      await this.uploadAndCreate(local.root.path, added, remote, signal, tracker);
    }

    if (modified.size > 0) {
      logger.debug({ tag: 'BACKUPS', msg: 'Files modified', count: modified.size });
      await this.uploadAndUpdate(modified, signal, tracker);
    }

    if (deleted.length > 0) {
      logger.debug({ tag: 'BACKUPS', msg: 'Files deleted', count: deleted.length });
      await this.deleteRemoteFiles(deleted, signal, tracker);
    }
  }

  private async uploadAndCreate(
    localRootPath: string,
    added: Array<LocalFile>,
    remoteTree: RemoteTree,
    signal: AbortSignal,
    tracker: BackupProgressTracker,
  ): Promise<void> {
    const executor = createBackupUploadExecutor(localRootPath, remoteTree, this.bucket, this.environment, tracker);

    const result = await executeAsyncQueue(added, executor, { concurrency: DEFAULT_CONCURRENCY, signal });

    if (result.error) {
      throw result.error;
    }
  }

  private async uploadAndUpdate(
    modified: Map<LocalFile, File>,
    signal: AbortSignal,
    tracker: BackupProgressTracker,
  ): Promise<void> {
    const items: ModifiedFilePair[] = Array.from(modified.entries());

    const executor = createBackupUpdateExecutor(this.bucket, this.environment, tracker);

    const result = await executeAsyncQueue(items, executor, { concurrency: DEFAULT_CONCURRENCY, signal });

    if (result.error) {
      throw result.error;
    }
  }

  private async deleteRemoteFiles(
    deleted: Array<File>,
    signal: AbortSignal,
    tracker: BackupProgressTracker,
  ): Promise<void> {
    for (const file of deleted) {
      if (signal.aborted) {
        return;
      }

      // eslint-disable-next-line no-await-in-loop
      await addFileToTrash(file.uuid);
      tracker.incrementProcessed(1);
    }
  }
}
