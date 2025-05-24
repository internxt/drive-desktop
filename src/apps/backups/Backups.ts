import { Service } from 'diod';
import { FileBatchUpdater } from '../../context/local/localFile/application/update/FileBatchUpdater';
import { FileBatchUploader } from '../../context/local/localFile/application/upload/FileBatchUploader';
import { LocalFile } from '../../context/local/localFile/domain/LocalFile';
import { AbsolutePath } from '../../context/local/localFile/infrastructure/AbsolutePath';
import LocalTreeBuilder, { LocalTree } from '../../context/local/localTree/application/LocalTreeBuilder';
import { File } from '../../context/virtual-drive/files/domain/File';
import { Folder } from '../../context/virtual-drive/folders/domain/Folder';
import { SimpleFolderCreator } from '../../context/virtual-drive/folders/application/create/SimpleFolderCreator';
import { BackupsContext } from './BackupInfo';
import { AddedFilesBatchCreator } from './batches/AddedFilesBatchCreator';
import { ModifiedFilesBatchCreator } from './batches/ModifiedFilesBatchCreator';
import { DiffFilesCalculator, FilesDiff } from './diff/DiffFilesCalculator';
import { FoldersDiff, FoldersDiffCalculator } from './diff/FoldersDiffCalculator';
import { getParentDirectory } from './utils/relative';
import { DriveDesktopError } from '../../context/shared/domain/errors/DriveDesktopError';
import { RemoteTree } from './remote-tree/domain/RemoteTree';
import { LocalFolder } from '../../context/local/localFolder/domain/LocalFolder';
import { FolderPath } from '@/context/virtual-drive/folders/domain/FolderPath';
import { logger } from '@/apps/shared/logger/logger';
import { DangledFilesService } from './dangled-files/DangledFilesService';
import { Traverser } from './remote-tree/traverser';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { BackupsProcessTracker } from '../main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { retryWrapper } from '@/infra/drive-server-wip/out/retry-wrapper';

@Service()
export class Backup {
  constructor(
    private readonly fileBatchUploader: FileBatchUploader,
    private readonly fileBatchUpdater: FileBatchUpdater,
    private readonly simpleFolderCreator: SimpleFolderCreator,
    private readonly dangledFilesService: DangledFilesService,
  ) {}

  private backed = 0;

  async run(tracker: BackupsProcessTracker, context: BackupsContext): Promise<DriveDesktopError | undefined> {
    const localTreeEither = await LocalTreeBuilder.run(context.pathname as AbsolutePath);

    if (localTreeEither.isLeft()) {
      logger.warn({ msg: 'Error building local tree', error: localTreeEither.getLeft() });
      return localTreeEither.getLeft();
    }

    const local = localTreeEither.getRight();

    const remote = await new Traverser().run({ context });

    const foldersDiff = FoldersDiffCalculator.calculate(local, remote);

    const filesDiff = DiffFilesCalculator.calculate(local, remote);

    if (filesDiff.dangled.size > 0) {
      logger.info({
        msg: 'Dangling files found, handling them',
        tag: 'BACKUPS',
      });

      const filesToResync = await this.dangledFilesService.handleDangledFile(filesDiff.dangled);

      for (const [localFile, remoteFile] of filesToResync) {
        logger.debug({
          msg: 'Resyncing dangling file',
          localPath: localFile.absolutePath,
          remoteId: remoteFile.contentsId,
          tag: 'BACKUPS',
        });
        filesDiff.modified.set(localFile, remoteFile);
      }
      filesDiff.total += filesDiff.dangled.size;
    }

    const alreadyBacked = filesDiff.unmodified.length + foldersDiff.unmodified.length;

    this.backed = alreadyBacked;

    logger.debug({
      tag: 'BACKUPS',
      msg: 'Total items to backup',
      total: filesDiff.total + foldersDiff.total,
      alreadyBacked,
    });

    tracker.currentTotal(filesDiff.total + foldersDiff.total);
    tracker.currentProcessed(alreadyBacked);

    await this.backupFolders(context, tracker, foldersDiff, local, remote);

    await this.backupFiles(context, tracker, filesDiff, local, remote);

    return;
  }

  private async backupFolders(
    context: BackupsContext,
    tracker: BackupsProcessTracker,
    diff: FoldersDiff,
    local: LocalTree,
    remote: RemoteTree,
  ) {
    const { added, deleted } = diff;

    logger.debug({
      tag: 'BACKUPS',
      msg: 'Backing folders',
      total: diff.total,
      added: added.length,
      deleted: deleted.length,
    });

    return await Promise.all([
      this.deleteRemoteFolders(context, deleted),
      this.uploadAndCreateFolder(context, tracker, local.root.absolutePath, added, remote),
    ]);
  }

  private async backupFiles(
    context: BackupsContext,
    tracker: BackupsProcessTracker,
    diff: FilesDiff,
    local: LocalTree,
    remote: RemoteTree,
  ) {
    const { added, modified, deleted } = diff;

    logger.debug({
      tag: 'BACKUPS',
      msg: 'Backing files',
      total: diff.total,
      added: added.length,
      deleted: deleted.length,
      modified: modified.size,
    });

    await Promise.all([
      this.uploadAndCreateFile(context, tracker, local.root.absolutePath, added, remote),
      this.uploadAndUpdate(context, tracker, modified, remote),
      this.deleteRemoteFiles(context, deleted),
    ]);
  }

  private async uploadAndCreateFile(
    context: BackupsContext,
    tracker: BackupsProcessTracker,
    localRootPath: string,
    added: Array<LocalFile>,
    tree: RemoteTree,
  ): Promise<void> {
    const batches = AddedFilesBatchCreator.run(added);

    for (const batch of batches) {
      try {
        if (context.abortController.signal.aborted) {
          return;
        }

        await this.fileBatchUploader.run(context, localRootPath, tree, batch, () => {
          this.backed += 1;
          tracker.currentProcessed(this.backed);
        });
      } catch (error) {
        logger.warn({
          msg: 'Error uploading files',
          error,
          tag: 'BACKUPS',
        });
        if (error instanceof DriveDesktopError) {
          throw error;
        }
      }
    }
  }

  private async uploadAndUpdate(
    context: BackupsContext,
    tracker: BackupsProcessTracker,
    modified: Map<LocalFile, File>,
    remoteTree: RemoteTree,
  ): Promise<void> {
    const batches = ModifiedFilesBatchCreator.run(modified);

    for (const batch of batches) {
      if (context.abortController.signal.aborted) {
        return;
      }

      try {
        await this.fileBatchUpdater.run(context, remoteTree, Array.from(batch.keys()));
      } catch (error) {
        logger.warn({
          msg: 'Error updating files',
          error,
          tag: 'BACKUPS',
        });
        if (error instanceof DriveDesktopError) {
          throw error;
        }
      }
      this.backed += batch.size;
      tracker.currentProcessed(this.backed);
    }
  }

  private async deleteRemoteFiles(context: BackupsContext, deleted: Array<File>) {
    for (const file of deleted) {
      if (context.abortController.signal.aborted) {
        return;
      }

      const promise = () => driveServerWip.storage.deleteFileByUuid({ uuid: file.uuid });
      const { error } = await retryWrapper({
        promise,
        loggerBody: {
          tag: 'BACKUPS',
          msg: 'Retry deleting file',
        },
      });

      if (error) throw error;
    }
  }

  private async deleteRemoteFolders(context: BackupsContext, deleted: Array<Folder>) {
    for (const folder of deleted) {
      if (context.abortController.signal.aborted) {
        return;
      }

      const promise = () => driveServerWip.storage.deleteFolderByUuid({ uuid: folder.uuid });
      const { error } = await retryWrapper({
        promise,
        loggerBody: {
          tag: 'BACKUPS',
          msg: 'Retry deleting folder',
        },
      });

      if (error) throw error;
    }
  }
  private async uploadAndCreateFolder(
    context: BackupsContext,
    tracker: BackupsProcessTracker,
    localRootPath: string,
    added: Array<LocalFolder>,
    tree: RemoteTree,
  ): Promise<void> {
    for (const localFolder of added) {
      if (context.abortController.signal.aborted) {
        return;
      }

      if (localFolder.relativePath === '/') {
        continue; // ingore root folder
      }

      const remoteParentPath = getParentDirectory(localRootPath, localFolder.absolutePath);

      logger.debug({
        msg: 'Uploading and creating folder',
        relativePath: localFolder.relativePath,
      });

      const parentExists = tree.has(remoteParentPath);

      if (!parentExists) {
        logger.debug({ msg: 'Parent folder does not exist' });
        continue;
      }

      const parent = tree.getParent(localFolder.relativePath);
      const existingItems = tree.has(localFolder.relativePath);

      if (existingItems) {
        continue;
      }

      try {
        const path = new FolderPath(localFolder.relativePath);

        const folder = await this.simpleFolderCreator.run({
          parentId: parent.id,
          parentUuid: parent.uuid,
          path: path.value,
          basename: path.basename(),
        });

        tree.addFolder(parent, folder);
      } catch (error) {
        logger.warn({
          msg: 'Error creating folder',
          error,
          tag: 'BACKUPS',
        });
        if (error instanceof DriveDesktopError) {
          throw error;
        }
      }

      this.backed++;
      tracker.currentProcessed(this.backed);
    }
  }
}
