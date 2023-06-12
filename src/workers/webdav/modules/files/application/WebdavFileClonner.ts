import { WebdavFolderFinder } from '../../folders/application/WebdavFolderFinder';
import { FilePath } from '../domain/FilePath';
import { RemoteFileContentsRepository } from '../domain/RemoteFileContentsRepository';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';
import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';
import { FileAlreadyExistsError } from '../domain/errors/FileAlreadyExistsError';

export class WebdavFileClonner {
  private static FILE_OVERRIDED = true;
  private static FILE_NOT_OVERRIDED = false;

  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly folderFinder: WebdavFolderFinder,
    private readonly contentRepository: RemoteFileContentsRepository,
    private readonly eventBus: WebdavServerEventBus
  ) {}

  private async overwrite(
    file: WebdavFile,
    fileOverwritted: WebdavFile,
    destinationPath: FilePath
  ) {
    const destinationFolder = this.folderFinder.run(fileOverwritted.dirname);

    const clonnedFileId = await this.contentRepository.clone(file);
    const newFile = file.overwrite(
      clonnedFileId,
      destinationFolder.id,
      destinationPath
    );

    fileOverwritted.trash();

    await this.repository.delete(fileOverwritted);
    await this.repository.add(newFile);

    await this.eventBus.publish(newFile.pullDomainEvents());
    await this.eventBus.publish(fileOverwritted.pullDomainEvents());
  }

  private async copy(file: WebdavFile, path: FilePath) {
    const destinationFolder = this.folderFinder.run(path.dirname());

    const clonnedFileId = await this.contentRepository.clone(file);

    const clonned = file.clone(clonnedFileId, destinationFolder.id, path);

    await this.repository.add(clonned);

    await this.eventBus.publish(clonned.pullDomainEvents());
  }

  async run(
    originFile: WebdavFile,
    destination: string,
    overwrite: boolean
  ): Promise<boolean> {
    const destinationPath = new FilePath(destination);

    const destinationFile = this.repository.search(destinationPath);

    if (destinationFile && !overwrite) {
      throw new FileAlreadyExistsError(destination);
    }

    if (destinationFile) {
      await this.overwrite(originFile, destinationFile, destinationPath);
      return WebdavFileClonner.FILE_OVERRIDED;
    }

    await this.copy(originFile, destinationPath);
    return WebdavFileClonner.FILE_NOT_OVERRIDED;
  }
}
