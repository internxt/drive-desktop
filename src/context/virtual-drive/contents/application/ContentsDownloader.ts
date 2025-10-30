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

  private downloaderIntance: EnvironmentContentFileDownloader | null = null;
  private downloaderIntanceCB: CallbackDownload | null = null;
  private downloaderFile: SimpleDriveFile | null = null;

  async run({ file, callback }: { file: SimpleDriveFile; callback: CallbackDownload }): Promise<string> {
    const downloader = this.managerFactory.downloader();

    const location = await temporalFolderProvider();
    await mkdir(location, { recursive: true });
    const path = join(location, file.nameWithExtension);

    this.downloaderIntance = downloader;
    this.downloaderIntanceCB = callback;
    this.downloaderFile = file;

    const { data: readable, error } = await downloader.download({
      file,
      onProgress: async (progress) => {
        ipcRendererSyncEngine.send('FILE_DOWNLOADING', { key: file.uuid, nameWithExtension: file.nameWithExtension, progress });
        await callback(true, path);
      },
    });

    if (!readable) throw error;

    await WriteReadableToFile.write(readable, path, file.size);

    return path;
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
