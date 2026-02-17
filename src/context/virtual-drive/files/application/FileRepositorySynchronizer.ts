import { Service } from 'diod';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { StorageFileService } from '../../../storage/StorageFiles/StorageFileService';
import { deleteFileFromTrash } from '../../../../infra/drive-server/services/files/services/delete-file-from-trash';

@Service()
export class FileRepositorySynchronizer {
  constructor(
    private readonly repository: FileRepository,
    private readonly storageFileService: StorageFileService,
  ) {}

  async fixDanglingFiles(contentsIds: Array<File['contentsId']>): Promise<boolean> {
    let allDanglingFilesFixed = true;
    try {
      const files = await this.repository.searchByArrayOfContentsId(contentsIds);
      if (files.length === 0) {
        logger.debug({ msg: '[DANGLING FILE] No files found to check.' });
        return allDanglingFilesFixed;
      }

      logger.debug({
        msg: `[DANGLING FILE] Checking ${files.length} files for corruption.`,
      });

      for (const file of files) {
        try {
          if (file.size === 0) {
            continue;
          }
          // eslint-disable-next-line no-await-in-loop
          const resultEither = await this.storageFileService.isFileDownloadable(file.contentsId);
          if (resultEither.isRight()) {
            const isFileDownloadable = resultEither.getRight();
            if (!isFileDownloadable) {
              logger.warn({
                msg: `[DANGLING FILE] File ${file.contentsId} is not downloadable, deleting...`,
              });
              // eslint-disable-next-line no-await-in-loop
              const { error } = await deleteFileFromTrash(file.contentsId);
              if (error) {
                logger.error({
                  msg: '[FILE SYSTEM] Delete file from trash failed:',
                  error,
                });

                throw new Error('Error when hard deleting file');
              }
            }
          } else {
            const error = resultEither.getLeft();
            logger.error({
              msg: `[DANGLING FILE] Error checking file ${file.contentsId}:`,
              error,
            });
            allDanglingFilesFixed = false;
          }
        } catch (error) {
          logger.error({
            msg: `[DANGLING FILE] Unexpected error processing file ${file.contentsId}:`,
            error,
          });
          allDanglingFilesFixed = false;
        }
      }

      logger.debug({ msg: '[DANGLING FILE] Finished checking all files.' });
      return allDanglingFilesFixed;
    } catch (error) {
      logger.error({ msg: '[DANGLING FILE] Error trying to retrieve files:', error });
      return false;
    }
  }

  async clear(): Promise<void> {
    await this.repository.clear();
  }

  async run(files: Array<File>): Promise<boolean> {
    // Resets the repository since replaced files become duplicated as
    // not all applications use the replace endpoint
    await this.repository.clear();

    const addPromises = files.map((file: File) => this.repository.upsert(file));

    const addResults = await Promise.all(addPromises);

    return addResults.some((newerFileAdded) => newerFileAdded);
  }
}
