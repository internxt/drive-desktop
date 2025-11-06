import path from 'node:path';
import { ensureFolderExists } from '../../../../apps/shared/fs/ensure-folder-exists';
import { ipcRendererSyncEngine } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { EnvironmentRemoteFileContentsManagersFactory } from '../infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { EnvironmentContentFileDownloader } from '../infrastructure/download/EnvironmentContentFileDownloader';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { temporalFolderProvider } from './temporalFolderProvider';
import { logger } from '@/apps/shared/logger/logger';
import { CallbackDownload } from '@/node-win/types/callbacks.type';
import { FSLocalFileWriter } from '../infrastructure/FSLocalFileWriter';

export class ContentsDownloader {
  constructor(private readonly managerFactory: EnvironmentRemoteFileContentsManagersFactory) {}

  private downloaderIntance: EnvironmentContentFileDownloader | null = null;
  private downloaderIntanceCB: CallbackDownload | null = null;
  private downloaderFile: SimpleDriveFile | null = null;

  private async registerEvents(downloader: EnvironmentContentFileDownloader, file: SimpleDriveFile, callback: CallbackDownload) {
    const location = await temporalFolderProvider();
    ensureFolderExists(location);

    const filePath = path.join(location, file.nameWithExtension);

    downloader.on('finish', () => {
      // cb(true, filePath);
      // The file download being finished does not mean it has been hidratated
      // TODO: We might want to track this time instead of the whole completion time
    });
  }

  async run({ file, callback }: { file: SimpleDriveFile; callback: CallbackDownload }): Promise<string> {
    const downloader = this.managerFactory.downloader();

    this.downloaderIntance = downloader;
    this.downloaderIntanceCB = callback;
    this.downloaderFile = file;
    await this.registerEvents(downloader, file, callback);

    const readable = await downloader.download({ contentsId: file.contentsId });

    const write = await FSLocalFileWriter.write({ file, readable });

    return write;
  }

  stop() {
    logger.debug({ msg: '[Server] Stopping download 1' });
    if (!this.downloaderIntance || !this.downloaderIntanceCB || !this.downloaderFile) return;

    logger.debug({ msg: '[Server] Stopping download 2' });
    this.downloaderIntance.forceStop();
    void this.downloaderIntanceCB(false, '');

    ipcRendererSyncEngine.send('FILE_DOWNLOAD_CANCEL', {
      key: this.downloaderFile.uuid,
      nameWithExtension: this.downloaderFile.nameWithExtension,
    });

    this.downloaderIntanceCB = null;
    this.downloaderIntance = null;
    this.downloaderFile = null;
  }
}
