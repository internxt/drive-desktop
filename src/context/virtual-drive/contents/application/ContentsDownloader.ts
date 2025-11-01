import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { ipcRendererSyncEngine } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { EnvironmentRemoteFileContentsManagersFactory } from '../infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { EnvironmentContentFileDownloader } from '../infrastructure/download/EnvironmentContentFileDownloader';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { CallbackDownload } from '@/node-win/types/callbacks.type';
import { AbsolutePath, logger } from '@internxt/drive-desktop-core/build/backend';

export class ContentsDownloader {
  constructor(private readonly managerFactory: EnvironmentRemoteFileContentsManagersFactory) {}

  private downloader: EnvironmentContentFileDownloader | null = null;
  private path: AbsolutePath | null = null;

  async run({
    ctx,
    file,
    path,
    callback,
  }: {
    ctx: ProcessSyncContext;
    file: SimpleDriveFile;
    path: AbsolutePath;
    callback: CallbackDownload;
  }) {
    const downloader = this.managerFactory.downloader();

    this.downloader = downloader;
    this.path = path;

    const { data: readable, error } = await downloader.download({
      file,
      path,
      onProgress: (progress) => {
        ipcRendererSyncEngine.send('FILE_DOWNLOADING', { path, progress });
      },
    });

    try {
      if (!readable) throw error;

      let offset = 0;

      for await (const chunk of readable) {
        const buffer = Buffer.from(chunk);

        callback(false, buffer, offset);

        offset += buffer.length;
      }

      ctx.logger.debug({ msg: 'File downloaded', path });

      ipcRendererSyncEngine.send('FILE_DOWNLOADED', { path });

      callback(true);
    } catch (error) {
      if (error instanceof Error && error.message !== 'The operation was aborted') {
        ctx.logger.error({ msg: 'Error downloading file', error });

        ipcRendererSyncEngine.send('FILE_DOWNLOAD_ERROR', { path });

        downloader.forceStop();
      }
    }
  }

  stop() {
    logger.debug({ msg: 'Stop download file' });

    if (!this.downloader || !this.path) return;

    try {
      ipcRendererSyncEngine.send('FILE_DOWNLOAD_CANCEL', { path: this.path });

      this.downloader.forceStop();
    } catch (error) {
      logger.error({ msg: 'Error stopping file download', path: this.path, error });
    }

    this.downloader = null;
    this.path = null;
  }
}
