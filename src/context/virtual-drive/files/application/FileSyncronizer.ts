import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { FilePath } from '../domain/FilePath';
import { FileStatuses } from '../domain/FileStatus';
import Logger from 'electron-log';
import { FileCreator } from './FileCreator';
import { AbsolutePathToRelativeConverter } from '../../shared/application/AbsolutePathToRelativeConverter';
import { FolderNotFoundError } from '../../folders/domain/errors/FolderNotFoundError';
import { FolderCreator } from '../../folders/application/FolderCreator';
import * as fs from 'fs';
import { File } from '../domain/File';
import { FileSyncStatusUpdater } from './FileSyncStatusUpdater';
import { FileContentsUpdater } from './FileContentsUpdater';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { RetryContentsUploader } from '../../contents/application/RetryContentsUploader';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { logger } from '@/apps/shared/logger/logger';
import { createParentFolder } from '@/features/sync/add-item/create-folder';
import { NodeWinLocalFileSystem } from '../infrastructure/NodeWinLocalFileSystem';

export class FileSyncronizer {
  constructor(
    private readonly repository: InMemoryFileRepository,
    private readonly fileSyncStatusUpdater: FileSyncStatusUpdater,
    private readonly virtualDrive: VirtualDrive,
    private readonly fileCreator: FileCreator,
    private readonly absolutePathToRelativeConverter: AbsolutePathToRelativeConverter,
    private readonly folderCreator: FolderCreator,
    private readonly fileContentsUpdater: FileContentsUpdater,
    private readonly contentsUploader: RetryContentsUploader,
    private readonly localFileSystem: NodeWinLocalFileSystem,
  ) {}

  async run(absolutePath: string): Promise<void> {
    const win32RelativePath = this.absolutePathToRelativeConverter.run(absolutePath);

    const posixRelativePath = PlatformPathConverter.winToPosix(win32RelativePath);

    const path = new FilePath(posixRelativePath);

    const existingFile = this.repository.searchByPartial({
      path: PlatformPathConverter.winToPosix(path.value),
      status: FileStatuses.EXISTS,
    });

    await this.sync(existingFile, absolutePath, posixRelativePath, path);
  }

  private async sync(existingFile: File | undefined, absolutePath: string, posixRelativePath: string, path: FilePath) {
    //
    if (existingFile) {
      if (this.hasDifferentSize(existingFile, absolutePath)) {
        const contents = await this.contentsUploader.run(posixRelativePath);
        existingFile = await this.fileContentsUpdater.run(existingFile, contents.id, contents.size);
        Logger.info('existingFile ', existingFile);
      }
      await this.convertAndUpdateSyncStatus(existingFile);
      //
    } else {
      await this.retryCreation(posixRelativePath, path);
    }
  }

  private retryCreation = async (posixRelativePath: string, filePath: FilePath, attemps = 3) => {
    try {
      const fileContents = await this.contentsUploader.run(posixRelativePath);
      const createdFile = await this.fileCreator.run(filePath, fileContents);
      await this.convertAndUpdateSyncStatus(createdFile);
    } catch (error: unknown) {
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error creating file',
        posixRelativePath,
        exc: error,
      });

      if (error instanceof FolderNotFoundError) {
        await createParentFolder({
          posixRelativePath,
          folderCreator: this.folderCreator,
        });
      }

      if (error instanceof Error && error.message.includes('Max space used')) {
        return;
      }

      if (attemps > 0) {
        await this.retryCreation(posixRelativePath, filePath, attemps - 1);
        return;
      }
    }
  };

  private hasDifferentSize(file: File, absoulthePath: string) {
    const stats = fs.statSync(absoulthePath);
    return Math.abs(file.size - stats.size) > 0.001;
  }

  private convertAndUpdateSyncStatus(file: File) {
    this.virtualDrive.convertToPlaceholder({ itemPath: file.path, id: file.placeholderId });
    this.localFileSystem.updateFileIdentity(file.path, file.placeholderId);
    this.fileSyncStatusUpdater.run(file);
  }
}
