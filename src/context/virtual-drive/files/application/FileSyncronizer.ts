import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { FilePath } from '../domain/FilePath';
import { FileRepository } from '../domain/FileRepository';
import { FileStatuses } from '../domain/FileStatus';
import Logger from 'electron-log';
import { FileCreator } from './FileCreator';
import { AbsolutePathToRelativeConverter } from '../../shared/application/AbsolutePathToRelativeConverter';
import { FolderNotFoundError } from '../../folders/domain/errors/FolderNotFoundError';
import { FolderCreator } from '../../folders/application/FolderCreator';
import { OfflineFolderCreator } from '../../folders/application/Offline/OfflineFolderCreator';
import { Folder } from '../../folders/domain/Folder';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';
import * as fs from 'fs';
import { File } from '../domain/File';

export class FileSyncronizer {
  constructor(
    private readonly repository: FileRepository,
    private readonly localFileSystem: LocalFileSystem,
    private readonly fileCreator: FileCreator,
    private readonly absolutePathToRelativeConverter: AbsolutePathToRelativeConverter,
    private readonly folderCreator: FolderCreator,
    private readonly offlineFolderCreator: OfflineFolderCreator
  ) {}

  async run(
    absolutePath: string,
    upload: (path: string) => Promise<RemoteFileContents>
  ) {
    const win32RelativePath =
      this.absolutePathToRelativeConverter.run(absolutePath);

    const posixRelativePath =
      PlatformPathConverter.winToPosix(win32RelativePath);

    const path = new FilePath(posixRelativePath);

    const existingFile = this.repository.searchByPartial({
      path: PlatformPathConverter.winToPosix(path.value),
      status: FileStatuses.EXISTS,
    });

    Logger.debug(`Updating sync status file ${posixRelativePath}`);
    if (existingFile) {
      if (this.hasDifferentSize(existingFile, absolutePath)) {
        Logger.debug(
          `[${posixRelativePath}] has different size update content`
        );
        return;
      }
      Logger.debug(`[${posixRelativePath}] already exists`);
      await this.localFileSystem.updateSyncStatus(existingFile);
    } else {
      Logger.debug(`[${posixRelativePath}] does not exist`);
      await this.retryCreation(posixRelativePath, path, upload);
    }
  }

  private async retryCreation(
    posixRelativePath: string,
    filePath: FilePath,
    upload: (path: string) => Promise<RemoteFileContents>,
    attemps = 3
  ) {
    try {
      const fileContents = await upload(posixRelativePath);
      const createdFile = await this.fileCreator.run(filePath, fileContents);
      await this.localFileSystem.updateSyncStatus(createdFile);
    } catch (error: unknown) {
      if (error instanceof FolderNotFoundError) {
        await this.createFolderFather(posixRelativePath);
      }
      if (attemps > 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await this.retryCreation(
          posixRelativePath,
          filePath,
          upload,
          attemps - 1
        );
        return;
      }
    }
  }

  private async runFolderCreator(posixRelativePath: string): Promise<Folder> {
    const offlineFolder = this.offlineFolderCreator.run(posixRelativePath);
    return this.folderCreator.run(offlineFolder);
  }

  private async createFolderFather(posixRelativePath: string) {
    Logger.info('posixRelativePath', posixRelativePath);
    const posixDir =
      PlatformPathConverter.getFatherPathPosix(posixRelativePath);
    Logger.info('posixDir', posixDir);
    try {
      await this.runFolderCreator(posixDir);
    } catch (error) {
      Logger.error('Error creating folder father creation:', error);
      if (error instanceof FolderNotFoundError) {
        // father created
        await this.createFolderFather(posixDir);
        // child created
        await this.runFolderCreator(posixDir);
      } else {
        Logger.error(
          'Error creating folder father creation inside catch:',
          error
        );
        throw error;
      }
    }
  }

  private hasDifferentSize(file: File, absoulthePath: string) {
    const stats = fs.statSync(absoulthePath);
    return file.size !== stats.size;
  }
}
