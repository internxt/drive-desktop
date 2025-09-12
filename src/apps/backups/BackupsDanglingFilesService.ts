import { Service } from 'diod';
import { LocalFile } from '../../context/local/localFile/domain/LocalFile';
import { File } from '../../context/virtual-drive/files/domain/File';
import { StorageFileService } from '../../context/storage/StorageFiles/StorageFileService';
import { logger } from '@internxt/drive-desktop-core/build/backend';

@Service()
export class BackupsDanglingFilesService {
  constructor(private readonly storageFileService: StorageFileService) {}

  async handleDanglingFilesOnBackup(
    danglingFiles: Map<LocalFile, File>
  ): Promise<Map<LocalFile, File>> {
    logger.debug({
      tag: 'BACKUPS',
      msg: 'BackupsDanglingFilesService started for dangling files',
      count: danglingFiles.size
    });
    const filesToResync = new Map<LocalFile, File>();

    for (const [localFile, remoteFile] of danglingFiles) {
      try {
        logger.debug({
          tag: 'BACKUPS',
          msg: '[BACKUP DANGLING FILE] Checking file',
          contentsId: remoteFile.contentsId
        });
        const resultEither = await this.storageFileService.isFileDownloadable(
          remoteFile.contentsId
        );
        if (resultEither.isRight()) {
          const isFileDownloadable = resultEither.getRight();
          if (!isFileDownloadable) {
            logger.warn({
              tag: 'BACKUPS',
              msg: '[BACKUP DANGLING FILE] File is not downloadable, backing up again',
              contentsId: remoteFile.contentsId
            });
            filesToResync.set(localFile, remoteFile);
          }
        } else {
          const error = resultEither.getLeft();
          logger.error({
            tag: 'BACKUPS',
            msg: '[BACKUP DANGLING FILE] Error checking file',
            contentsId: remoteFile.contentsId,
            error: error.message
          });
        }
      } catch (error) {
        logger.error({
          tag: 'BACKUPS',
          msg: '[BACKUP DANGLING FILE] Error while handling dangling file',
          contentsId: remoteFile.contentsId,
          error
        });
      }
    }
    return filesToResync;
  }
}
