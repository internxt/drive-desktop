import { ActionNotPermitedError } from '../domain/errors/ActionNotPermitedError';
import { FileAlreadyExistsError } from '../domain/errors/FileAlreadyExistsError';
import { FilePath } from '../domain/FilePath';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { WebdavFolderFinder } from '../../folders/application/WebdavFolderFinder';
import { FileFinderByContentsId } from './FileFinderByContentsId';

export class FilePathUpdater {
  constructor(
    private readonly repository: FileRepository,
    private readonly fileFinderByContentsId: FileFinderByContentsId,
    private readonly folderFinder: WebdavFolderFinder
  ) {}

  private async rename(file: File, path: FilePath) {
    file.rename(path);

    await this.repository.updateName(file);

    // await this.eventBus.publish(file.pullDomainEvents());
  }

  async run(contentsId: string, destination: FilePath) {
    // this.ipc.send('WEBDAV_FILE_RENAMING', {
    //   oldName: file.name,
    //   nameWithExtension: destination.nameWithExtension(),
    // });

    const file = this.fileFinderByContentsId.run(contentsId);

    if (file.dirname !== destination.dirname()) {
      if (file.nameWithExtension !== destination.nameWithExtension()) {
        throw new ActionNotPermitedError('rename and change folder');
      }

      const destinationFolder = this.folderFinder.run(
        destination.posixDirname()
      );

      file.moveTo(destinationFolder);

      await this.repository.updateParentDir(file);
    }

    const destinationFile = this.repository.search(destination);

    if (destinationFile) {
      // this.ipc.send('WEBDAV_FILE_RENAME_ERROR', {
      //   name: file.name,
      //   extension: file.type,
      //   nameWithExtension: file.nameWithExtension,
      //   error: 'Renaming error: file already exists',
      // });
      throw new FileAlreadyExistsError(destination.name());
    }

    if (destination.extensionMatch(file.type)) {
      await this.rename(file, destination);
      return;
    }

    throw new Error('Cannot reupload files atm');
  }
}
