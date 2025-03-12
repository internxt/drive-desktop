import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';
import { EnvironmentRemoteFileContentsManagersFactory } from '../../contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import Logger from 'electron-log';
import { FileCheckerStatusInRoot } from './FileCheckerStatusInRoot';
import { ensureFolderExists } from '@/apps/shared/fs/ensure-folder-exists';
import { temporalFolderProvider } from '../../contents/application/temporalFolderProvider';
import { ContentFileDownloader } from '../../contents/domain/contentHandlers/ContentFileDownloader';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { File } from '../domain/File';
import { DangledFilesManager } from '../../shared/domain/DangledFilesManager';
import { FileContentsHardUpdater } from './FileContentsHardUpdater';

export class FileOverwriteContent {
    private processingErrorQueue: boolean;
    constructor(
        private readonly repository: InMemoryFileRepository,
        private readonly fileCheckerStatusInRoot: FileCheckerStatusInRoot,
        private readonly fileContentsHardUpdater: FileContentsHardUpdater,
    ) {
        this.processingErrorQueue = false;
    }

    private errorQueue: Array<{
        file: File;
        callback: (remoteDangledFile: string) => Promise<void>;
    }> = [];

    private async processErrorQueue() {
        if (this.processingErrorQueue) return;
        this.processingErrorQueue = true;
        while (this.errorQueue.length > 0) {
            const { file, callback } = this.errorQueue.shift()!;
            await callback(file.contentsId);
        }
        this.processingErrorQueue = false;
    }

    private enqueueError(
        file: File,
        callback: (remoteDangledFile: string) => Promise<void>
    ) {
        this.errorQueue.push({ file, callback });
        this.processErrorQueue();
    }

    private async registerEvents(
        downloader: ContentFileDownloader,
        file: File,
        fixCallback: (remoteDangledFile: string) => Promise<void>,
    ) {
        const location = await temporalFolderProvider();
        ensureFolderExists(location);

        downloader.on('start', () => {
            Logger.info(`Downloading file start${file.path}...`);
        });

        downloader.on('progress', async () => {
            Logger.info(`Downloading file force stop${file.path}...`);
            downloader.forceStop();
        });

        downloader.on('error', (error: Error) => {
            Logger.error('[FileSyncronizer] Error downloading file', error.message, file.path);
            if (error.message.includes('Object not found')) {
                this.enqueueError(file, fixCallback);
            } else {
                Logger.error('Error downloading file', error);
            }
        });
    }

    async run(
        contentsIds: File['contentsId'][],
        upload: (path: string) => Promise<RemoteFileContents>,
        downloaderManger: EnvironmentRemoteFileContentsManagersFactory,
    ) {
        Logger.debug('Inside overrideDangledFiles');
        const files = await this.repository.searchByContentsIds(contentsIds);

        Logger.info('files fetched in overrideDangledFiles', files);

        const filesWithContentLocally = this.fileCheckerStatusInRoot.isHydrated(files.map((file) => file.path));

        Logger.debug('filesWithContentLocally', filesWithContentLocally);


        const asynchronousFixingOfDangledFiles = async (remoteDangledFile: string) => {
            const hydratedDangledRemoteFile = files.find((file) => remoteDangledFile == file.contentsId);

            if (!hydratedDangledRemoteFile) {
                Logger.error(`File ${remoteDangledFile} not found in local files`);
                return;
            }

            Logger.info('hydratedDangledRemoteFile ', { id: hydratedDangledRemoteFile.contentsId, path: hydratedDangledRemoteFile.path });

            await this.fileContentsHardUpdater.run(
                {
                    contentsId: hydratedDangledRemoteFile.contentsId,
                    folderId: hydratedDangledRemoteFile.folderId.value,
                    size: hydratedDangledRemoteFile.size,
                    path: hydratedDangledRemoteFile.path,
                },
                upload,
            );
        };


        for (const file of files) {
            if (filesWithContentLocally[file.path]) {
                const downloader = downloaderManger.downloader();
                this.registerEvents(downloader, file, asynchronousFixingOfDangledFiles);

                Logger.debug('Trying to download file ', file.uuid, ' ', file.name);
                await downloader.download(file);

                Logger.info(`Possible dangled file ${file.path} hydrated.`);
                DangledFilesManager.getInstance().add(file.contentsId, file.path);
            } else {
                Logger.info(`Possible dangled file ${file.path} not hydrated.`);
            }
        }
    }

}