import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';
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
import { FilePlaceholderConverter } from './FIlePlaceholderConverter';
import { FileContentsUpdater } from './FileContentsUpdater';
import { FileIdentityUpdater } from './FileIndetityUpdater';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { DangledFilesManager } from '../../shared/domain/DangledFilesManager';
import { FileCheckerStatusInRoot } from './FileCheckerStatusInRoot';
import { EnvironmentRemoteFileContentsManagersFactory } from '../../contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { ContentFileDownloader } from '../../contents/domain/contentHandlers/ContentFileDownloader';
import { temporalFolderProvider } from '../../contents/application/temporalFolderProvider';
import { ensureFolderExists } from '@/apps/shared/fs/ensure-folder-exists';
import { ipcRenderer } from 'electron';

export class FileSyncronizer {
  // queue of files to be uploaded
  private foldersPathQueue: string[] = [];
  constructor(
    private readonly repository: InMemoryFileRepository,
    private readonly fileSyncStatusUpdater: FileSyncStatusUpdater,
    private readonly filePlaceholderConverter: FilePlaceholderConverter,
    private readonly fileIdentityUpdater: FileIdentityUpdater,
    private readonly fileCreator: FileCreator,
    private readonly absolutePathToRelativeConverter: AbsolutePathToRelativeConverter,
    private readonly folderCreator: FolderCreator,
    private readonly offlineFolderCreator: OfflineFolderCreator,
    // private readonly foldersFatherSyncStatusUpdater: FoldersFatherSyncStatusUpdater
    private readonly fileContentsUpdater: FileContentsUpdater,
    private readonly fileCheckerStatusInRoot: FileCheckerStatusInRoot,
  ) { }

  // eslint-disable-next-line max-len
  private async registerEvents(downloader: ContentFileDownloader, file: File, callback: (hydratedFilesIds: string[], remoteDangledFiles: string[]) => Promise<void>) {
    const location = await temporalFolderProvider();
    ensureFolderExists(location);

    downloader.on('progress', async () => {
      Logger.info(`Downloading file force stop${file.path}...`);
      DangledFilesManager.getInstance().addDiscardedDangledFiles(file.contentsId, callback);
      downloader.forceStop();
    });

    downloader.on('error', (error: Error) => {
      Logger.error('[Server] Error downloading file', error);
      if (error.message.includes('Object not found')) {
        DangledFilesManager.getInstance().addRemoteDangledFiles(file.contentsId, callback);
      } else {
        DangledFilesManager.getInstance().addDiscardedDangledFiles(file.contentsId, callback);
      }
    });
  }

  async overrideDangledFiles(
    contentsIds: File['contentsId'][],
    upload: (path: string) => Promise<RemoteFileContents>,
    downloaderManger: EnvironmentRemoteFileContentsManagersFactory,
  ) {
    Logger.debug('Inside overrideDangledFiles');
    const files = await this.repository.searchByContentsIds(contentsIds);

    const filesWithContentLocally = this.fileCheckerStatusInRoot.isHydrated(files.map((file) => file.path));

    Logger.debug('filesWithContentLocally', filesWithContentLocally);

    const healthyFilesIds: string[] = [];

    const asynchronousCheckingOfDangledFiles = async (hydratedFilesIds: string[], remoteDangledFiles: string[]) => {

      Logger.debug('Hydrated files ids: ', hydratedFilesIds);
      Logger.debug('Remote dangled files: ', remoteDangledFiles);

      const hydratedFiles = files.filter((file) => hydratedFilesIds.includes(file.contentsId));
      const hydratedFilesRemotlyDangled = hydratedFiles.filter((file) => {
        if (remoteDangledFiles.includes(file.contentsId)) {
          return true;
        } else {
          healthyFilesIds.push(file.contentsId);
          return false;
        }
      });

      Logger.info('hydratedFilesRemoteDangled List: ', hydratedFilesRemotlyDangled);

      await ipcRenderer.invoke('SET_HEALTHY_FILES', healthyFilesIds);

      const updatedFiles = [];

      for (const file of hydratedFilesRemotlyDangled) {
        const updatedOutput = await this.fileContentsUpdater.hardUpdateRun(
          {
            contentsId: file.contentsId,
            folderId: file.folderId.value,
            size: file.size,
            path: file.path,
          },
          upload,
        );
        updatedFiles.push(updatedOutput);
      }


      Logger.debug(`Processed dangled files: ${updatedFiles}`);
      const toUpdateInDatabase = updatedFiles.reduce((acc: string[], current) => {
        if (current.updated) {
          acc.push(current.contentsId);
        }
        return acc;
      }, []);

      Logger.debug(`Updating dangled files in database: ${toUpdateInDatabase}`);

      await ipcRenderer.invoke('UPDATE_FIXED_FILES', {
        itemIds: toUpdateInDatabase,
        fileFilter: { status: 'DELETED' },
      });
    };

    for (const file of files) {
      if (filesWithContentLocally[file.path]) {
        const downloader = downloaderManger.downloader();
        this.registerEvents(downloader, file, asynchronousCheckingOfDangledFiles);
        downloader.download(file);

        Logger.info(`Possible dangled file ${file.path} hydrated.`);
        DangledFilesManager.getInstance().add(file.contentsId, file.path);
        DangledFilesManager.getInstance().addToCheckDangledFiles(file.contentsId);
      } else {
        Logger.info(`Possible dangled file ${file.path} not hydrated.`);
      }
    }

  }

  async run(absolutePath: string, upload: (path: string) => Promise<RemoteFileContents>): Promise<void> {
    const win32RelativePath = this.absolutePathToRelativeConverter.run(absolutePath);

    const posixRelativePath = PlatformPathConverter.winToPosix(win32RelativePath);

    const path = new FilePath(posixRelativePath);

    const existingFile = this.repository.searchByPartial({
      path: PlatformPathConverter.winToPosix(path.value),
      status: FileStatuses.EXISTS,
    });

    await this.sync(existingFile, absolutePath, posixRelativePath, path, upload);
  }

  private async sync(
    existingFile: File | undefined,
    absolutePath: string,
    posixRelativePath: string,
    path: FilePath,
    upload: (path: string) => Promise<RemoteFileContents>,
  ) {
    //
    if (existingFile) {
      if (this.hasDifferentSize(existingFile, absolutePath)) {
        const contents = await upload(posixRelativePath);
        existingFile = await this.fileContentsUpdater.run(existingFile, contents.id, contents.size);
        Logger.info('existingFile ', existingFile);
      }
      await this.convertAndUpdateSyncStatus(existingFile);
      //
    } else {
      await this.retryCreation(posixRelativePath, path, upload);
    }
  }

  private retryCreation = async (
    posixRelativePath: string,
    filePath: FilePath,
    upload: (path: string) => Promise<RemoteFileContents>,
    attemps = 3,
  ) => {
    try {
      const fileContents = await upload(posixRelativePath);
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
        await this.retryCreation(posixRelativePath, filePath, upload, attemps - 1);
        return;
      }
    }
  };

  private async runFolderCreator(posixRelativePath: string): Promise<Folder> {
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
    await Promise.all([this.filePlaceholderConverter.run(file), this.fileIdentityUpdater.run(file), this.fileSyncStatusUpdater.run(file)]);
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
