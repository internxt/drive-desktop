import { ipcRendererSyncEngine } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { EnvironmentRemoteFileContentsManagersFactory } from '../infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { EnvironmentContentFileDownloader } from '../infrastructure/download/EnvironmentContentFileDownloader';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { logger } from '@/apps/shared/logger/logger';
import { CallbackDownload } from '@/node-win/types/callbacks.type';

export class ContentsDownloader {
  constructor(private readonly managerFactory: EnvironmentRemoteFileContentsManagersFactory) {}

  private downloader: EnvironmentContentFileDownloader | null = null;
  private file: SimpleDriveFile | null = null;

  async run({ file, callback }: { file: SimpleDriveFile; callback: CallbackDownload }) {
    const downloader = this.managerFactory.downloader();

    this.downloader = downloader;
    this.file = file;

    const { data: readable, error } = await downloader.download({
      file,
      onProgress: (progress) => {
        ipcRendererSyncEngine.send('FILE_DOWNLOADING', { key: file.uuid, nameWithExtension: file.nameWithExtension, progress });
      },
    });

    try {
      if (!readable) throw error;

      let offset = 0;

      for await (const chunk of readable) {
        const buffer = Buffer.from(chunk);

        callback(false, buffer, offset);

        offset += buffer.length;

        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: 'Streamed bytes',
          name: file.nameWithExtension,
          size: file.size,
          offset,
        });
      }

      logger.debug({ tag: 'SYNC-ENGINE', msg: 'File downloaded', name: file.nameWithExtension });

      ipcRendererSyncEngine.send('FILE_DOWNLOADED', { key: file.uuid, nameWithExtension: file.nameWithExtension });

      callback(true);
    } catch (error) {
      if (error instanceof Error && error.message !== 'The operation was aborted') {
        logger.error({ msg: 'Error downloading file', error });

        ipcRendererSyncEngine.send('FILE_DOWNLOAD_ERROR', { key: file.uuid, nameWithExtension: file.nameWithExtension });

        downloader.forceStop();
      }
    }
  }

  stop() {
    logger.debug({ msg: 'Stop download file' });

    if (!this.downloader || !this.file) return;

    try {
      ipcRendererSyncEngine.send('FILE_DOWNLOAD_CANCEL', { key: this.file.uuid, nameWithExtension: this.file.nameWithExtension });

      this.downloader.forceStop();
    } catch (error) {
      logger.error({ tag: 'SYNC-ENGINE', msg: 'Error stopping file download', name: this.file.nameWithExtension, error });
    }

    this.downloader = null;
    this.file = null;
  }
}
