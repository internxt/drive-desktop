import { ActionNotPermitedError } from '../domain/errors/ActionNotPermitedError';
import { FileAlreadyExistsError } from '../domain/errors/FileAlreadyExistsError';
import { FilePath } from '../domain/FilePath';
import { ContentsManagersFactory } from '../../contents/domain/ContentsManagersFactory';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { WebdavFolderFinder } from '../../folders/application/WebdavFolderFinder';

export class WebdavFileRenamer {
  constructor(
    private readonly repository: FileRepository,
    private readonly contentsRepository: ContentsManagersFactory,
    private readonly folderFinder: WebdavFolderFinder
  ) {}

  private async rename(file: File, path: FilePath) {
    file.rename(path);

    await this.repository.updateName(file);

    // await this.eventBus.publish(file.pullDomainEvents());
  }

  private async reupload(file: File, path: FilePath) {
    const clonner = this.contentsRepository.clonner(file);

    const clonnedFileId = await clonner.clone();

    const uploaded = file.overwrite(clonnedFileId.value, file.folderId, path);

    file.trash();
    await this.repository.add(uploaded);
    await this.repository.delete(file);

    // await this.eventBus.publish(uploaded.pullDomainEvents());
    // await this.eventBus.publish(file.pullDomainEvents());
  }

  async run(file: File, destination: FilePath) {
    // this.ipc.send('WEBDAV_FILE_RENAMING', {
    //   oldName: file.name,
    //   nameWithExtension: destination.nameWithExtension(),
    // });
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

    await this.reupload(file, destination);
  }
}
