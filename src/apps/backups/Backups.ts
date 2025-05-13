import { Service } from 'diod';
import { FileBatchUpdater } from '../../context/local/localFile/application/update/FileBatchUpdater';
import { FileBatchUploader } from '../../context/local/localFile/application/upload/FileBatchUploader';
import { LocalFile } from '../../context/local/localFile/domain/LocalFile';
import { AbsolutePath } from '../../context/local/localFile/infrastructure/AbsolutePath';
import LocalTreeBuilder, { LocalTree } from '../../context/local/localTree/application/LocalTreeBuilder';
import { File } from '../../context/virtual-drive/files/domain/File';
import { Folder } from '../../context/virtual-drive/folders/domain/Folder';
import { SimpleFolderCreator } from '../../context/virtual-drive/folders/application/create/SimpleFolderCreator';
import { BackupInfo } from './BackupInfo';
import { BackupsIPCRenderer } from './BackupsIPCRenderer';
import { AddedFilesBatchCreator } from './batches/AddedFilesBatchCreator';
import { ModifiedFilesBatchCreator } from './batches/ModifiedFilesBatchCreator';
import { DiffFilesCalculator, FilesDiff } from './diff/DiffFilesCalculator';
import { FoldersDiff, FoldersDiffCalculator } from './diff/FoldersDiffCalculator';
import { getParentDirectory } from './utils/relative';
import { DriveDesktopError } from '../../context/shared/domain/errors/DriveDesktopError';
import { RemoteTree } from './remote-tree/domain/RemoteTree';
import { FolderDeleter } from '../../context/virtual-drive/folders/application/delete/FolderDeleter';
import { LocalFolder } from '../../context/local/localFolder/domain/LocalFolder';
import { FolderPath } from '@/context/virtual-drive/folders/domain/FolderPath';
import { logger } from '@/apps/shared/logger/logger';
import { DangledFilesService } from './dangled-files/DangledFilesService';
import { Traverser } from './remote-tree/traverser';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

@Service()
export class Backup {
  constructor(
    private readonly fileBatchUploader: FileBatchUploader,
    private readonly fileBatchUpdater: FileBatchUpdater,
    private readonly remoteFolderDeleter: FolderDeleter,
    private readonly simpleFolderCreator: SimpleFolderCreator,
    private readonly dangledFilesService: DangledFilesService,
  ) {}

  private backed = 0;

  async run(info: BackupInfo, abortController: AbortController): Promise<DriveDesktopError | undefined> {
    const localTreeEither = await LocalTreeBuilder.run(info.pathname as AbsolutePath);

    if (localTreeEither.isLeft()) {
      logger.warn({ msg: 'Error building local tree', error: localTreeEither.getLeft() });
      return localTreeEither.getLeft();
    }

    const local = localTreeEither.getRight();

    const remote = await new Traverser().run({
      rootFolderId: info.folderId,
      rootFolderUuid: info.folderUuid,
    });

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
          localPath: localFile.path,
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

    BackupsIPCRenderer.send('backups.total-items-calculated', filesDiff.total + foldersDiff.total, alreadyBacked);

    await this.backupFolders(foldersDiff, local, remote, abortController);

    await this.backupFiles(filesDiff, local, remote, abortController);

    return undefined;
  }

  private async backupFolders(diff: FoldersDiff, local: LocalTree, remote: RemoteTree, abortController: AbortController) {
    const { added, deleted } = diff;

    logger.debug({
      tag: 'BACKUPS',
      msg: 'Backing folders',
      total: diff.total,
      added: added.length,
      deleted: deleted.length,
    });

    return await Promise.all([
      this.deleteRemoteFolders(deleted, abortController),
      this.uploadAndCreateFolder(local.root.path, added, remote),
    ]);
  }

  private async backupFiles(diff: FilesDiff, local: LocalTree, remote: RemoteTree, abortController: AbortController) {
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
      this.uploadAndCreateFile(local.root.path, added, remote, abortController),
      this.uploadAndUpdate(modified, remote, abortController),
      this.deleteRemoteFiles(deleted, abortController),
    ]);
  }

  private async uploadAndCreateFile(
    localRootPath: string,
    added: Array<LocalFile>,
    tree: RemoteTree,
    abortController: AbortController,
  ): Promise<void> {
    const batches = AddedFilesBatchCreator.run(added);

    for (const batch of batches) {
      try {
        if (abortController.signal.aborted) {
          return;
        }
        await this.fileBatchUploader.run(localRootPath, tree, batch, abortController.signal, () => {
          this.backed += 1;
          BackupsIPCRenderer.send('backups.progress-update', this.backed);
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

  private async uploadAndUpdate(modified: Map<LocalFile, File>, remoteTree: RemoteTree, abortController: AbortController): Promise<void> {
    const batches = ModifiedFilesBatchCreator.run(modified);

    for (const batch of batches) {
      if (abortController.signal.aborted) {
        return;
      }
      try {
        await this.fileBatchUpdater.run(remoteTree, Array.from(batch.keys()), abortController.signal);
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
      BackupsIPCRenderer.send('backups.progress-update', this.backed);
    }
  }

  private async deleteRemoteFiles(deleted: Array<File>, abortController: AbortController) {
    for (const file of deleted) {
      if (abortController.signal.aborted) {
        return;
      }
      try {
        await driveServerWip.storage.deleteFileByUuid({ uuid: file.uuid });
      } catch (error) {
        logger.warn({
          msg: 'Error deleting file',
          error,
          tag: 'BACKUPS',
        });
        if (error instanceof DriveDesktopError) {
          throw error;
        }
      }
    }
  }

  private async deleteRemoteFolders(deleted: Array<Folder>, abortController: AbortController) {
    for (const folder of deleted) {
      if (abortController.signal.aborted) {
        return;
      }

      try {
        await this.remoteFolderDeleter.run(folder);
      } catch (error) {
        logger.warn({
          msg: 'Error deleting folder',
          error,
          tag: 'BACKUPS',
        });
        if (error instanceof DriveDesktopError) {
          throw error;
        }
      }
    }
  }
  private async uploadAndCreateFolder(localRootPath: string, added: Array<LocalFolder>, tree: RemoteTree): Promise<void> {
    for (const localFolder of added) {
      if (localFolder.relativePath === '/') {
        continue; // ingore root folder
      }

      const remoteParentPath = getParentDirectory(localRootPath, localFolder.path);

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
      BackupsIPCRenderer.send('backups.progress-update', this.backed);
    }
  }
}
