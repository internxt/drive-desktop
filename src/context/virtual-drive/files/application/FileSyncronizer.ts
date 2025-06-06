import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { FilePath } from '../domain/FilePath';
import { FileStatuses } from '../domain/FileStatus';
import Logger from 'electron-log';
import { FileCreator } from './FileCreator';
import { AbsolutePathToRelativeConverter } from '../../shared/application/AbsolutePathToRelativeConverter';
import { FolderNotFoundError } from '../../folders/domain/errors/FolderNotFoundError';
import { FolderCreator } from '../../folders/application/FolderCreator';
import { OfflineFolderCreator } from '../../folders/application/Offline/OfflineFolderCreator';
import { Folder } from '../../folders/domain/Folder';
import * as fs from 'fs';
import { File } from '../domain/File';
import { FileSyncStatusUpdater } from './FileSyncStatusUpdater';
import { FileContentsUpdater } from './FileContentsUpdater';
import { FileIdentityUpdater } from './FileIndetityUpdater';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { RetryContentsUploader } from '../../contents/application/RetryContentsUploader';
import { VirtualDrive } from '@/node-win/virtual-drive';

export class FileSyncronizer {
  // queue of files to be uploaded
  private foldersPathQueue: string[] = [];

  constructor(
    private readonly repository: InMemoryFileRepository,
    private readonly fileSyncStatusUpdater: FileSyncStatusUpdater,
    private readonly virtualDrive: VirtualDrive,
    private readonly fileIdentityUpdater: FileIdentityUpdater,
    private readonly fileCreator: FileCreator,
    private readonly absolutePathToRelativeConverter: AbsolutePathToRelativeConverter,
    private readonly folderCreator: FolderCreator,
    private readonly offlineFolderCreator: OfflineFolderCreator,
    private readonly fileContentsUpdater: FileContentsUpdater,
    private readonly contentsUploader: RetryContentsUploader,
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
      Logger.error('Error creating file:', error);
      if (error instanceof FolderNotFoundError) {
        await this.createFolderFather(posixRelativePath);
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

  private runFolderCreator(posixRelativePath: string): Promise<Folder> {
    const offlineFolder = this.offlineFolderCreator.run(posixRelativePath);
    return this.folderCreator.run(offlineFolder);
  }

  private async createFolderFather(posixRelativePath: string) {
    Logger.info('posixRelativePath', posixRelativePath);
    const posixDir = PlatformPathConverter.getFatherPathPosix(posixRelativePath);
    try {
      await this.runFolderCreator(posixDir);
    } catch (error) {
      Logger.error('Error creating folder father creation:', error);
      if (error instanceof FolderNotFoundError) {
        this.foldersPathQueue.push(posixDir);
        // father created
        await this.createFolderFather(posixDir);
        // child created
        Logger.info('Creating child', posixDir);
        await this.retryFolderCreation(posixDir);
      } else {
        Logger.error('Error creating folder father creation inside catch:', error);
        throw error;
      }
    }
  }

  private hasDifferentSize(file: File, absoulthePath: string) {
    const stats = fs.statSync(absoulthePath);
    return Math.abs(file.size - stats.size) > 0.001;
  }

  private async convertAndUpdateSyncStatus(file: File) {
    await Promise.all([
      this.virtualDrive.convertToPlaceholder({
        itemPath: file.path,
        id: file.placeholderId,
      }),
      this.fileIdentityUpdater.run(file),
      this.fileSyncStatusUpdater.run(file),
    ]);
  }

  private retryFolderCreation = async (posixDir: string, attemps = 3) => {
    try {
      await this.runFolderCreator(posixDir);
    } catch (error) {
      Logger.error('Error creating folder father creation:', error);
      if (attemps > 0) {
        await this.retryFolderCreation(posixDir, attemps - 1);
        return;
      }
    }
  };
}
