import { WebdavFolderFinder } from '../../folders/application/WebdavFolderFinder';
import { FilePath } from '../domain/FilePath';
import { RemoteFileContentsRepository } from '../domain/FileContentRepository';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';
import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';
import { FileNotFoundError } from '../domain/errors/FileNotFoundError';
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

  private async overwrite(file: WebdavFile, destinationFile: WebdavFile) {
    const clonnedFileId = await this.contentRepository.clone(file);
    const newFile = destinationFile.override(file, clonnedFileId);

    await this.repository.delete(destinationFile);
    await this.repository.add(newFile);
  }

  private async copy(file: WebdavFile, path: FilePath) {
    const destinationFolder = this.folderFinder.run(path.dirname());

    const clonnedFileId = await this.contentRepository.clone(file);

    const clonned = file.clone(clonnedFileId, destinationFolder.id, path);

    await this.repository.add(clonned);

    this.eventBus.publish(clonned.pullDomainEvents());
  }

  async run(
    origin: string,
    destination: string,
    overwrite: boolean
  ): Promise<boolean> {
    const originFile = this.repository.search(origin);

    if (!originFile) {
      throw new FileNotFoundError(origin);
    }

    const destinationFile = this.repository.search(destination);

    if (destinationFile && !overwrite) {
      throw new FileAlreadyExistsError(destination);
    }

    if (destinationFile) {
      await this.overwrite(originFile, destinationFile);
      return WebdavFileClonner.FILE_OVERRIDED;
    }

    const destinationPath = new FilePath(destination);

    await this.copy(originFile, destinationPath);
    return WebdavFileClonner.FILE_NOT_OVERRIDED;
  }
}
