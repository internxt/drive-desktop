import { Service } from 'diod';
import Logger from 'electron-log';
import { FileBatchUpdater } from '../../context/local/localFile/application/update/FileBatchUpdater';
import { FileBatchUploader } from '../../context/local/localFile/application/upload/FileBatchUploader';
import { LocalFile } from '../../context/local/localFile/domain/LocalFile';
import { AbsolutePath } from '../../context/local/localFile/infrastructure/AbsolutePath';
import LocalTreeBuilder from '../../context/local/localTree/application/LocalTreeBuilder';
import { LocalTree } from '../../context/local/localTree/domain/LocalTree';
import { FileDeleter } from '../../context/virtual-drive/files/application/delete/FileDeleter';
import { File } from '../../context/virtual-drive/files/domain/File';
import { SimpleFolderCreator } from '../../context/virtual-drive/folders/application/create/SimpleFolderCreator';
import { RemoteTreeBuilder } from '../../context/virtual-drive/remoteTree/application/RemoteTreeBuilder';
import { RemoteTree } from '../../context/virtual-drive/remoteTree/domain/RemoteTree';
import { BackupInfo } from './BackupInfo';
import { BackupsIPCRenderer } from './BackupsIPCRenderer';
import { AddedFilesBatchCreator } from './batches/AddedFilesBatchCreator';
import { ModifiedFilesBatchCreator } from './batches/ModifiedFilesBatchCreator';
import { DiffFilesCalculator, FilesDiff } from './diff/DiffFilesCalculator';
import {
  FoldersDiff,
  FoldersDiffCalculator,
} from './diff/FoldersDiffCalculator';
import { relative } from './utils/relative';
import { DriveDesktopError } from '../../context/shared/domain/errors/DriveDesktopError';
import { UserAvaliableSpaceValidator } from '../../context/user/usage/application/UserAvaliableSpaceValidator';

@Service()
export class Backup {
  constructor(
    private readonly localTreeBuilder: LocalTreeBuilder,
    private readonly remoteTreeBuilder: RemoteTreeBuilder,
    private readonly fileBatchUploader: FileBatchUploader,
    private readonly fileBatchUpdater: FileBatchUpdater,
    private readonly remoteFileDeleter: FileDeleter,
    private readonly simpleFolderCreator: SimpleFolderCreator,
    private readonly userAvaliableSpaceValidator: UserAvaliableSpaceValidator
  ) {}

  private backed = 0;

  async run(
    info: BackupInfo,
    abortController: AbortController
  ): Promise<DriveDesktopError | undefined> {
    Logger.info('[BACKUPS] Backing:', info.pathname);

    Logger.info('[BACKUPS] Generating local tree');
    const localTreeEither = await this.localTreeBuilder.run(
      info.pathname as AbsolutePath
    );

    if (localTreeEither.isLeft()) {
      return localTreeEither.getLeft();
    }

    const local = localTreeEither.getRight();

    Logger.info('[BACKUPS] Generating remote tree');
    const remote = await this.remoteTreeBuilder.run(info.folderId);

    const foldersDiff = FoldersDiffCalculator.calculate(local, remote);

    const filesDiff = DiffFilesCalculator.calculate(local, remote);

    await this.isThereEnoughSpace(filesDiff);

    const alreadyBacked =
      filesDiff.unmodified.length + foldersDiff.unmodified.length;

    this.backed = alreadyBacked;

    BackupsIPCRenderer.send(
      'backups.total-items-calculated',
      filesDiff.total + foldersDiff.total,
      alreadyBacked
    );

    await this.backupFolders(foldersDiff, local, remote);

    await this.backupFiles(filesDiff, local, remote, abortController);

    return undefined;
  }

  private async isThereEnoughSpace(filesDiff: FilesDiff): Promise<void> {
    const bytesToUpload = filesDiff.added.reduce((acc, file) => {
      acc += file.size;

      return acc;
    }, 0);

    const bytesToUpdate = Array.from(filesDiff.modified.entries()).reduce(
      (acc, [local, remote]) => {
        acc += local.size - remote.size;

        return acc;
      },
      0
    );

    const total = bytesToUpdate + bytesToUpload;

    const thereIsEnoughSpace = await this.userAvaliableSpaceValidator.run(
      total
    );

    if (!thereIsEnoughSpace) {
      throw new DriveDesktopError(
        'NOT_ENOUGH_SPACE',
        'The size of the files to upload is greater than the avaliable space'
      );
    }
  }

  private async backupFolders(
    diff: FoldersDiff,
    local: LocalTree,
    remote: RemoteTree
  ) {
    Logger.info('[BACKUPS] Backing folders');

    Logger.info('[BACKUPS] Folders added', diff.added.length);

    for (const localFolder of diff.added) {
      const remoteParentPath = relative(local.root.path, localFolder.basedir());

      const parentExists = remote.has(remoteParentPath);

      if (!parentExists) {
        continue;
      }

      const parent = remote.getParent(
        relative(local.root.path, localFolder.path)
      );

      // eslint-disable-next-line no-await-in-loop
      const folder = await this.simpleFolderCreator.run(
        relative(local.root.path, localFolder.path),
        parent.id
      );

      remote.addFolder(parent, folder);

      this.backed++;
      BackupsIPCRenderer.send('backups.progress-update', this.backed);
    }
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
    await this.uploadAndCreate(local.root.path, added, remote, abortController);

    Logger.info('[BACKUPS] Files modified', modified.size);
    await this.uploadAndUpdate(modified, local, remote, abortController);

    Logger.info('[BACKUPS] Files deleted', deleted.length);
    await this.deleteRemoteFiles(deleted, abortController);
  }

  private async uploadAndCreate(
    localRootPath: string,
    added: Array<LocalFile>,
    tree: RemoteTree,
    abortController: AbortController
  ): Promise<void> {
    const batches = AddedFilesBatchCreator.run(added);

    for (const batch of batches) {
      if (abortController.signal.aborted) {
        return;
      }
      // eslint-disable-next-line no-await-in-loop
      await this.fileBatchUploader.run(
        localRootPath,
        tree,
        batch,
        abortController.signal
      );

      this.backed += batch.length;
      BackupsIPCRenderer.send('backups.progress-update', this.backed);
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
      // eslint-disable-next-line no-await-in-loop
      await this.fileBatchUpdater.run(
        localTree.root,
        remoteTree,
        Array.from(batch.keys()),
        abortController.signal
      );

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

      // eslint-disable-next-line no-await-in-loop
      await this.remoteFileDeleter.run(file);
    }

    this.backed += deleted.length;
    BackupsIPCRenderer.send('backups.progress-update', this.backed);
  }
}
