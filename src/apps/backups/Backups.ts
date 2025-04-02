import { Service } from 'diod';
import { FileBatchUpdater } from '../../context/local/localFile/application/update/FileBatchUpdater';
import { FileBatchUploader } from '../../context/local/localFile/application/upload/FileBatchUploader';
import { LocalFile } from '../../context/local/localFile/domain/LocalFile';
import { AbsolutePath } from '../../context/local/localFile/infrastructure/AbsolutePath';
import LocalTreeBuilder from '../../context/local/localTree/application/LocalTreeBuilder';
import { LocalTree } from '../../context/local/localTree/domain/LocalTree';
import { File } from '../../context/virtual-drive/files/domain/File';
import { Folder } from '../../context/virtual-drive/folders/domain/Folder';
import { SimpleFolderCreator } from '../../context/virtual-drive/folders/application/create/SimpleFolderCreator';
import { BackupInfo } from './BackupInfo';
import { BackupsIPCRenderer } from './BackupsIPCRenderer';
import { AddedFilesBatchCreator } from './batches/AddedFilesBatchCreator';
import { ModifiedFilesBatchCreator } from './batches/ModifiedFilesBatchCreator';
import { DiffFilesCalculator, FilesDiff } from './diff/DiffFilesCalculator';
import { FoldersDiff, FoldersDiffCalculator } from './diff/FoldersDiffCalculator';
import { getParentDirectory, relativeV2 } from './utils/relative';
import { DriveDesktopError } from '../../context/shared/domain/errors/DriveDesktopError';
import { FileDeleter } from '../../context/virtual-drive/files/application/delete/FileDeleter';
import { RemoteTreeBuilder } from '../../context/virtual-drive/remoteTree/application/RemoteTreeBuilder';
import { RemoteTree } from '../../context/virtual-drive/remoteTree/domain/RemoteTree';
import { FolderDeleter } from '../../context/virtual-drive/folders/application/delete/FolderDeleter';
import { LocalFolder } from '../../context/local/localFolder/domain/LocalFolder';
import { FolderPath } from '@/context/virtual-drive/folders/domain/FolderPath';
import { logger } from '@/apps/shared/logger/logger';
import { EnvironmentRemoteFileContentsManagersFactory } from '@/context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';

@Service()
export class Backup {
  constructor(
    private readonly localTreeBuilder: LocalTreeBuilder,
    private readonly remoteTreeBuilder: RemoteTreeBuilder,
    private readonly fileBatchUploader: FileBatchUploader,
    private readonly fileBatchUpdater: FileBatchUpdater,
    private readonly remoteFileDeleter: FileDeleter,
    private readonly remoteFolderDeleter: FolderDeleter,
    private readonly simpleFolderCreator: SimpleFolderCreator,
    private readonly contentsManagerFactory: EnvironmentRemoteFileContentsManagersFactory,
  ) {}

  async isFileDownloadable(file: File): Promise<boolean> {
    try {
      const downloader = this.contentsManagerFactory.downloader();

      logger.debug({
        msg: '[BACKUPS] Checking if file is downloadable',
        fileContentsId: file.contentsId,
        attributes: {
          tag: 'BACKUPS',
        },
      });

      const isDownloadable = new Promise<boolean>((resolve) => {
        downloader.on('start', () => {
          logger.debug({
            msg: '[BACKUPS] Downloading file',
            fileId: file.contentsId,
            name: file.name,
            attributes: {
              tag: 'BACKUPS',
            },
          });

          resolve(true);
        });

        downloader.on('progress', () => {
          logger.debug({
            msg: '[BACKUPS] Downloading file force stop',
            fileId: file.contentsId,
            name: file.name,
            attributes: {
              tag: 'BACKUPS',
            },
          });
          downloader.forceStop();
          resolve(false);
        });

        downloader.on('error', (error: Error) => {
          logger.debug({
            msg: '[BACKUPS] Error downloading file',
            fileId: file.contentsId,
            name: file.name,
            error,
            attributes: {
              tag: 'BACKUPS',
            },
          });
          resolve(true);
        });
      });
      await downloader.download(file);
      return await isDownloadable;
    } catch (error) {
      logger.warn({
        msg: '[BACKUPS] Error checking if file is downloadable',
        error,
        attributes: {
          tag: 'BACKUPS',
        },
      });
      return true;
    }
  }

  private backed = 0;

  async run(info: BackupInfo, abortController: AbortController): Promise<DriveDesktopError | undefined> {
    const localTreeEither = await this.localTreeBuilder.run(info.pathname as AbsolutePath);

    if (localTreeEither.isLeft()) {
      logger.warn({ msg: '[BACKUPS] Error building local tree', error: localTreeEither.getLeft() });
      return localTreeEither.getLeft();
    }

    const local = localTreeEither.getRight();

    const remote = await this.remoteTreeBuilder.run({
      rootFolderId: info.folderId,
      rootFolderUuid: info.folderUuid,
      refresh: false,
    });

    const foldersDiff = FoldersDiffCalculator.calculate(local, remote);

    const filesDiff = await DiffFilesCalculator.calculate(local, remote);

    for (const [localFile, remoteFile] of filesDiff.dangled.entries()) {
      if (!remoteFile) continue;
      const isDownloadable = await this.isFileDownloadable(remoteFile);

      logger.debug({
        msg: '[BACKUPS] Checking if file is downloadable',
        fileId: remoteFile.contentsId,
        name: remoteFile.name,
        attributes: {
          tag: 'BACKUPS',
        },
      });

      if (!isDownloadable) {
        filesDiff.modified.set(localFile, remoteFile);
        logger.debug({
          msg: '[BACKUPS] File is not downloadable',
          fileId: remoteFile.contentsId,
          attributes: {
            tag: 'BACKUPS',
          },
        });
      }
    }

    const alreadyBacked = filesDiff.unmodified.length + foldersDiff.unmodified.length;

    this.backed = alreadyBacked;

    logger.info({
      msg: '[BACKUPS] Total items to backup',
      total: filesDiff.total + foldersDiff.total,
      attributes: {
        tag: 'BACKUPS',
      },
    });

    logger.info({
      msg: '[BACKUPS] Total items already backed',
      total: alreadyBacked,
      attributes: {
        tag: 'BACKUPS',
      },
    });

    BackupsIPCRenderer.send('backups.total-items-calculated', filesDiff.total + foldersDiff.total, alreadyBacked);

    await this.backupFolders(foldersDiff, local, remote, abortController);

    await this.backupFiles(filesDiff, local, remote, abortController);

    return undefined;
  }

  private async backupFolders(diff: FoldersDiff, local: LocalTree, remote: RemoteTree, abortController: AbortController) {
    logger.info({
      msg: '[BACKUPS] Backing folders',
      total: diff.total,
      attributes: {
        tag: 'BACKUPS',
      },
    });

    const { added, deleted } = diff;

    const deleteFolder = this.deleteRemoteFolders(deleted, abortController);

    logger.debug({
      msg: '[BACKUPS] Folders added',
      added: added.length,
      attributes: {
        tag: 'BACKUPS',
      },
    });
    const uploadFolder = this.uploadAndCreateFolder(local.root.path, added, remote);

    return await Promise.all([deleteFolder, uploadFolder]);
  }

  private async backupFiles(filesDiff: FilesDiff, local: LocalTree, remote: RemoteTree, abortController: AbortController) {
    const { added, modified, deleted } = filesDiff;

    logger.debug({
      msg: '[BACKUPS] Files added',
      added: added.length,
      attributes: {
        tag: 'BACKUPS',
      },
    });
    await this.uploadAndCreateFile(local.root.path, added, remote, abortController);

    logger.debug({
      msg: '[BACKUPS] Files modified',
      modified: modified.size,
      attributes: {
        tag: 'BACKUPS',
      },
    });
    await this.uploadAndUpdate(modified, local, remote, abortController);

    logger.debug({
      msg: '[BACKUPS] Files deleted',
      deleted: deleted.length,
      attributes: {
        tag: 'BACKUPS',
      },
    });
    await this.deleteRemoteFiles(deleted, abortController);
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
        // eslint-disable-next-line no-await-in-loop
        await this.fileBatchUploader.run(localRootPath, tree, batch, abortController.signal, async () => {
          this.backed += 1;
          await BackupsIPCRenderer.send('backups.progress-update', this.backed);
        });
      } catch (error) {
        logger.warn({
          msg: '[BACKUPS] Error uploading files',
          error,
          attributes: {
            tag: 'BACKUPS',
          },
        });
        if (error instanceof DriveDesktopError) {
          throw error;
        }
      }
    }
  }

  private async uploadAndUpdate(
    modified: Map<LocalFile, File>,
    localTree: LocalTree,
    remoteTree: RemoteTree,
    abortController: AbortController,
  ): Promise<void> {
    const batches = ModifiedFilesBatchCreator.run(modified);

    for (const batch of batches) {
      if (abortController.signal.aborted) {
        return;
      }
      try {
        // eslint-disable-next-line no-await-in-loop
        await this.fileBatchUpdater.run(localTree.root, remoteTree, Array.from(batch.keys()), abortController.signal);
      } catch (error) {
        logger.warn({
          msg: '[BACKUPS] Error updating files',
          error,
          attributes: {
            tag: 'BACKUPS',
          },
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
        // eslint-disable-next-line no-await-in-loop
        await this.remoteFileDeleter.run(file);
      } catch (error) {
        logger.warn({
          msg: '[BACKUPS] Error deleting file',
          error,
          attributes: {
            tag: 'BACKUPS',
          },
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
        // eslint-disable-next-line no-await-in-loop
        await this.remoteFolderDeleter.run(folder);
      } catch (error) {
        logger.warn({
          msg: '[BACKUPS] Error deleting folder',
          error,
          attributes: {
            tag: 'BACKUPS',
          },
        });
        if (error instanceof DriveDesktopError) {
          throw error;
        }
      }
    }
  }
  private async uploadAndCreateFolder(localRootPath: string, added: Array<LocalFolder>, tree: RemoteTree): Promise<void> {
    for (const localFolder of added) {
      const relativePath = relativeV2(localRootPath, localFolder.path);

      if (relativePath === '/') {
        continue; // ingore root folder
      }

      const remoteParentPath = getParentDirectory(localRootPath, localFolder.path);

      logger.debug({
        msg: '[BACKUPS] Uploading and creating folder',
        relativePath,
      });

      const parentExists = tree.has(remoteParentPath);

      if (!parentExists) {
        logger.debug({ msg: '[BACKUPS] Parent folder does not exist' });
        continue;
      }

      const parent = tree.getParent(relativePath);
      const existingItems = tree.has(relativePath);

      if (existingItems) {
        continue;
      }

      try {
        const path = new FolderPath(relativePath);

        const folder = await this.simpleFolderCreator.run({
          parentId: parent.id,
          parentUuid: parent.uuid,
          path: path.value,
          basename: path.basename(),
        });

        tree.addFolder(parent, folder);
      } catch (error) {
        logger.warn({
          msg: '[BACKUPS] Error creating folder',
          error,
          attributes: {
            tag: 'BACKUPS',
          },
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
