import { ipcRendererSyncEngine } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { EnvironmentRemoteFileContentsManagersFactory } from '../infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { EnvironmentContentFileDownloader } from '../infrastructure/download/EnvironmentContentFileDownloader';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { temporalFolderProvider } from './temporalFolderProvider';
import { logger } from '@/apps/shared/logger/logger';
import { CallbackDownload } from '@/node-win/types/callbacks.type';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path/posix';
import { WriteReadableToFile } from '@/apps/shared/fs/write-readable-to-file';

export class ContentsDownloader {
  constructor(private readonly managerFactory: EnvironmentRemoteFileContentsManagersFactory) {}

  private downloader: EnvironmentContentFileDownloader | null = null;
  private callback: CallbackDownload | null = null;
  private file: SimpleDriveFile | null = null;

  async run({ file, callback }: { file: SimpleDriveFile; callback: CallbackDownload }) {
    const downloader = this.managerFactory.downloader();

    const location = await temporalFolderProvider();
    await mkdir(location, { recursive: true });
    const path = join(location, file.nameWithExtension);

    this.downloader = downloader;
    this.callback = callback;
    this.file = file;

    const { data: readable, error } = await downloader.download({
      file,
      onProgress: (progress) => {
        ipcRendererSyncEngine.send('FILE_DOWNLOADING', { key: file.uuid, nameWithExtension: file.nameWithExtension, progress });
      },
    });

    logger.debug({ msg: 'READABLEEEEEEEEEEEEEEEEEEEEEEEEEEEE' });

    if (!readable) throw error;

    await WriteReadableToFile.write(readable, path, file.size);

    logger.debug({ msg: 'BLOCKEDDDDDDDDDDDDDDDDDD' });

    return path;
  }

  stop() {
    logger.debug({ msg: '[Server] Stopping download 1' });
    if (!this.downloader || !this.callback || !this.file) return;

    logger.debug({ msg: '[Server] Stopping download 2' });
    this.downloader.forceStop();
    this.callback(false, '');

    ipcRendererSyncEngine.send('FILE_DOWNLOAD_CANCEL', {
      key: this.file.uuid,
      nameWithExtension: this.file.nameWithExtension,
    });

    this.callback = null;
    this.downloader = null;
    this.file = null;
  }
}
