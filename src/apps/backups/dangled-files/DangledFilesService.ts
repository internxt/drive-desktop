import { EnvironmentRemoteFileContentsManagersFactory } from '@/context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { Service } from 'diod';
import { File } from '../../../context/virtual-drive/files/domain/File';
import { logger } from '@/apps/shared/logger/logger';
import { LocalFile } from '@/context/local/localFile/domain/LocalFile';

@Service()
export class DangledFilesService {
  constructor(private readonly contentsManagerFactory: EnvironmentRemoteFileContentsManagersFactory) {}

  async isFileDownloadable(file: File): Promise<boolean> {
    try {
      const downloader = this.contentsManagerFactory.downloader();

      logger.debug({
        msg: 'Checking if file is downloadable',
        fileContentsId: file.contentsId,
        tag: 'BACKUPS',
      });

      const isDownloadable = new Promise<boolean>((resolve) => {
        downloader.on('start', () => {
          logger.debug({
            msg: 'Downloading file',
            fileId: file.contentsId,
            name: file.name,
            tag: 'BACKUPS',
          });

          resolve(true);
        });

        downloader.on('progress', () => {
          logger.debug({
            msg: 'Downloading file force stop',
            fileId: file.contentsId,
            name: file.name,
            tag: 'BACKUPS',
          });
          downloader.forceStop();
          resolve(true);
        });

        downloader.on('error', (error: Error) => {
          logger.debug({
            msg: 'Error downloading file',
            fileId: file.contentsId,
            name: file.name,
            error,
            tag: 'BACKUPS',
          });
          resolve(false);
        });
      });
      await downloader.download({ contentsId: file.contentsId });
      return await isDownloadable;
    } catch (error) {
      logger.warn({
        msg: 'Error checking if file is downloadable',
        error,
        tag: 'BACKUPS',
      });
      return false;
    }
  }

  async handleDangledFile(danglingFiles: Map<LocalFile, File>) {
    const filesToResync = new Map<LocalFile, File>();

    for (const [localFile, remoteFile] of danglingFiles.entries()) {
      if (!remoteFile) continue;

      let isDownloadable: boolean;
      try {
        isDownloadable = await this.isFileDownloadable(remoteFile);
      } catch (error) {
        logger.warn({
          msg: 'Error checking if file is downloadable in handleDangledFile',
          fileId: remoteFile.contentsId,
          error,
          tag: 'BACKUPS',
        });
        continue;
      }

      logger.debug({
        msg: 'Checking if file is downloadable',
        fileId: remoteFile.contentsId,
        name: remoteFile.name,
        tag: 'BACKUPS',
      });

      if (!isDownloadable) {
        filesToResync.set(localFile, remoteFile);
        logger.debug({
          msg: 'File is not downloadable',
          fileId: remoteFile.contentsId,
          tag: 'BACKUPS',
        });
      }
    }

    return filesToResync;
  }
}
