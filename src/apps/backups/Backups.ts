import { Service } from 'diod';
import Logger from 'electron-log';
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
import {
  FoldersDiff,
  FoldersDiffCalculator,
} from './diff/FoldersDiffCalculator';
import { getParentDirectory, relativeV2 } from './utils/relative';
import { DriveDesktopError } from '../../context/shared/domain/errors/DriveDesktopError';
import { UserAvaliableSpaceValidator } from '../../context/user/usage/application/UserAvaliableSpaceValidator';
import { FileDeleter } from '../../context/virtual-drive/files/application/delete/FileDeleter';
import { RemoteTreeBuilder } from '../../context/virtual-drive/remoteTree/application/RemoteTreeBuilder';
import { RemoteTree } from '../../context/virtual-drive/remoteTree/domain/RemoteTree';
import { FolderDeleter } from '../../context/virtual-drive/folders/application/delete/FolderDeleter';
import { LocalFolder } from '../../context/local/localFolder/domain/LocalFolder';

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
    private readonly userAvaliableSpaceValidator: UserAvaliableSpaceValidator
  ) {}

  private backed = 0;

  async run(
    info: BackupInfo,
    abortController: AbortController
  ): Promise<DriveDesktopError | undefined> {
    Logger.info('[BACKUPS] Local tree built 1');

    const localTreeEither = await this.localTreeBuilder.run(
      info.pathname as AbsolutePath
    );

    Logger.info('[BACKUPS] Local tree built 2');

    if (localTreeEither.isLeft()) {
      Logger.error('[BACKUPS] Error building local tree');
      Logger.error(localTreeEither.getLeft());
      return localTreeEither.getLeft();
    }

    Logger.info('[BACKUPS] Local tree built 3');

    const local = localTreeEither.getRight();

    const remote = await this.remoteTreeBuilder.run(info.folderId, true);

    const foldersDiff = FoldersDiffCalculator.calculate(local, remote);

    const filesDiff = DiffFilesCalculator.calculate(local, remote);

    const alreadyBacked =
      filesDiff.unmodified.length + foldersDiff.unmodified.length;

    this.backed = alreadyBacked;

    BackupsIPCRenderer.send(
      'backups.total-items-calculated',
      filesDiff.total + foldersDiff.total,
      alreadyBacked
    );

    await this.backupFolders(foldersDiff, local, remote, abortController);

    await this.backupFiles(filesDiff, local, remote, abortController);

    return undefined;
  }

  private async backupFolders(
    diff: FoldersDiff,
    local: LocalTree,
    remote: RemoteTree,
    abortController: AbortController
  ) {
    Logger.info('[BACKUPS] Backing folders');
    Logger.info('[BACKUPS] Folders added', diff.added.length);
    Logger.info('[BACKUPS] Folders deleted', diff.deleted.length);

    const { added, deleted } = diff;

    const deleteFolder = this.deleteRemoteFolders(deleted, abortController);

    Logger.debug('[BACKUPS] start upload', deleted.length);
    const uploadFolder = this.uploadAndCreateFolder(
      local.root.path,
      added,
      remote
    );

    return await Promise.all([deleteFolder, uploadFolder]);
  }

  private async backupFiles(
    filesDiff: FilesDiff,
    local: LocalTree,
    remote: RemoteTree,
    abortController: AbortController
  ) {
    Logger.info('[BACKUPS] Backing files');

    const { added, modified, deleted } = filesDiff;

    Logger.info('[BACKUPS] Files added', added.length);
    await this.uploadAndCreateFile(
      local.root.path,
      added,
      remote,
      abortController
    );

    Logger.info('[BACKUPS] Files modified', modified.size);
    await this.uploadAndUpdate(modified, local, remote, abortController);

    Logger.info('[BACKUPS] Files deleted', deleted.length);
    await this.deleteRemoteFiles(deleted, abortController);
  }

  private async uploadAndCreateFile(
    localRootPath: string,
    added: Array<LocalFile>,
    tree: RemoteTree,
    abortController: AbortController
  ): Promise<void> {
    const batches = AddedFilesBatchCreator.run(added);

    for (const batch of batches) {
      try {
        if (abortController.signal.aborted) {
          return;
        }
        // eslint-disable-next-line no-await-in-loop
        await this.fileBatchUploader.run(
          localRootPath,
          tree,
          batch,
          abortController.signal,
          async () => {
            this.backed += 1;
            await BackupsIPCRenderer.send(
              'backups.progress-update',
              this.backed
            );
          }
        );
      } catch (error) {
        Logger.error('Error uploading files', error);
        if (error instanceof DriveDesktopError) {
          Logger.error('Error uploading files', {
            cause: error.cause,
          });
          throw error;
        }
      }
    }
  }

  private async uploadAndUpdate(
    modified: Map<LocalFile, File>,
    localTree: LocalTree,
    remoteTree: RemoteTree,
    abortController: AbortController
  ): Promise<void> {
    const batches = ModifiedFilesBatchCreator.run(modified);

    for (const batch of batches) {
      Logger.debug('Signal aborted', abortController.signal.aborted);
      if (abortController.signal.aborted) {
        return;
      }
      try {
        // eslint-disable-next-line no-await-in-loop
        await this.fileBatchUpdater.run(
          localTree.root,
          remoteTree,
          Array.from(batch.keys()),
          abortController.signal
        );
      } catch (error) {
        Logger.error('[BACKUPS] Error updating files', error);
        if (error instanceof DriveDesktopError) {
          Logger.error('[BACKUPS] Error updating files', {
            cause: error.cause,
          });
          throw error;
        }
      }
      this.backed += batch.size;
      BackupsIPCRenderer.send('backups.progress-update', this.backed);
    }
  }

  private async deleteRemoteFiles(
    deleted: Array<File>,
    abortController: AbortController
  ) {
    for (const file of deleted) {
      if (abortController.signal.aborted) {
        return;
      }
      try {
        // eslint-disable-next-line no-await-in-loop
        await this.remoteFileDeleter.run(file);
      } catch (error) {
        Logger.error('[BACKUPS] Error deleting file', error);
        if (error instanceof DriveDesktopError) {
          Logger.error('[BACKUPS] Error deleting file', {
            cause: error.cause,
          });
          throw error;
        }
      }
    }

    this.backed += deleted.length;
    BackupsIPCRenderer.send('backups.progress-update', this.backed);
  }

  private async deleteRemoteFolders(
    deleted: Array<Folder>,
    abortController: AbortController
  ) {
    for (const folder of deleted) {
      if (abortController.signal.aborted) {
        return;
      }

      try {
        // eslint-disable-next-line no-await-in-loop
        await this.remoteFolderDeleter.run(folder);
      } catch (error) {
        Logger.error('[BACKUPS] Error deleting folder', error);
        if (error instanceof DriveDesktopError) {
          Logger.error('[BACKUPS] Error deleting folder', {
            cause: error.cause,
          });
          throw error;
        }
      }

      this.backed += deleted.length;
      BackupsIPCRenderer.send('backups.progress-update', this.backed);
    }
  }
  private async uploadAndCreateFolder(
    localRootPath: string,
    added: Array<LocalFolder>,
    tree: RemoteTree
  ): Promise<void> {
    for (const localFolder of added) {
      const relativePath = relativeV2(localRootPath, localFolder.path);

      Logger.debug('[BACKUPS] Relative path of folder', relativePath);

      if (relativePath === '/') {
        Logger.debug('[BACKUPS] Ignoring root folder');
        continue; // Ignorar la carpeta raíz
      }

      const remoteParentPath = getParentDirectory(
        localRootPath,
        localFolder.path
      );

      Logger.debug('[BACKUPS] Remote parent path', remoteParentPath);

      const parentExists = tree.has(remoteParentPath);

      if (!parentExists) {
        Logger.debug('[BACKUPS] Parent folder does not exist');
        continue;
      }

      const parent = tree.getParent(relativePath);
      const existingItems = tree.has(relativePath);

      if (existingItems) {
        Logger.debug('[BACKUPS] Folder already exists');
        continue;
      }

      try {
        const folder = await this.simpleFolderCreator.run(
          relativePath,
          parent.id
        );

        tree.addFolder(parent, folder);
      } catch (error) {
        Logger.error('[BACKUPS] Error creating folder', error);
        if (error instanceof DriveDesktopError) {
          Logger.error('[BACKUPS] Error creating folder', {
            cause: error.cause,
          });
          throw error;
        }
      }

      this.backed++;
      BackupsIPCRenderer.send('backups.progress-update', this.backed);
    }
  }
}
