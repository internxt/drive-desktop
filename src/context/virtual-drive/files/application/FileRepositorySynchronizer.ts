import { Service } from 'diod';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import Logger from 'electron-log';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { StorageFileService } from '../../../storage/StorageFiles/StorageFileService';

@Service()
export class FileRepositorySynchronizer {
  constructor(
    private readonly repository: FileRepository,
    private readonly storageFileService: StorageFileService,
    private readonly remoteFileSystem: RemoteFileSystem
  ) {}

  async fixDanglingFiles(
    contentsIds: Array<File['contentsId']>
  ): Promise<boolean> {
    let allDanglingFilesFixed = true;
    try {
      const files = await this.repository.searchByArrayOfContentsId(
        contentsIds
      );
      if (files.length === 0) {
        Logger.info('[DANGLING FILE] No files found to check.');
        return allDanglingFilesFixed;
      }

      Logger.info(
        `[DANGLING FILE] Checking ${files.length} files for corruption.`
      );

      for (const file of files) {
        try {
          const resultEither = await this.storageFileService.isFileDownloadable(
            file.contentsId
          );
          if (resultEither.isRight()) {
            const isFileDownloadable = resultEither.getRight();
            if (!isFileDownloadable) {
              Logger.warn(
                `[DANGLING FILE] File ${file.contentsId} is not downloadable, deleting...`
              );
              await this.remoteFileSystem.hardDelete(file.contentsId);
            }
          } else {
            const error = resultEither.getLeft();
            Logger.error(
              `[DANGLING FILE] Error checking file ${file.contentsId}: ${error.message}`
            );
            allDanglingFilesFixed = false;
          }
        } catch (error) {
          Logger.error(
            `[DANGLING FILE] Unexpected error processing file ${file.contentsId}: ${error}`
          );
          allDanglingFilesFixed = false;
        }
      }

      Logger.info('[DANGLING FILE] Finished checking all files.');
      return allDanglingFilesFixed;
    } catch (error) {
      Logger.error(`[DANGLING FILE] Error trying to retrieve files: ${error}`);
      return false;
    }
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
