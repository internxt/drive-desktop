import { ipcRendererSyncEngine } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { EnvironmentRemoteFileContentsManagersFactory } from '../infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { EnvironmentContentFileDownloader } from '../infrastructure/download/EnvironmentContentFileDownloader';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { logger } from '@/apps/shared/logger/logger';
import { CallbackDownload } from '@/node-win/types/callbacks.type';
import { FSLocalFileWriter } from '../infrastructure/FSLocalFileWriter';

export class ContentsDownloader {
  constructor(private readonly managerFactory: EnvironmentRemoteFileContentsManagersFactory) {}

  private downloaderIntance: EnvironmentContentFileDownloader | null = null;
  private downloaderIntanceCB: CallbackDownload | null = null;
  private downloaderFile: SimpleDriveFile | null = null;

  async run({ file, callback }: { file: SimpleDriveFile; callback: CallbackDownload }): Promise<string> {
    const downloader = this.managerFactory.downloader();

    this.downloaderIntance = downloader;
    this.downloaderIntanceCB = callback;
    this.downloaderFile = file;

    const readable = await downloader.download({ contentsId: file.contentsId });

    const write = await FSLocalFileWriter.write({ file, readable });

    return write;
  }

  stop({ path }: { path: string }) {
    logger.debug({ msg: '[Server] Stopping download 1' });
    if (!this.downloaderIntance || !this.downloaderIntanceCB || !this.downloaderFile) return;

    logger.debug({ msg: '[Server] Stopping download 2' });
    this.downloaderIntance.forceStop();
    void this.downloaderIntanceCB(false, '');

    ipcRendererSyncEngine.send('FILE_DOWNLOAD_CANCEL', { path });

    this.downloaderIntanceCB = null;
    this.downloaderIntance = null;
    this.downloaderFile = null;
  }
}
