import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';
import { ActionNotPermitedError } from '../domain/errors/ActionNotPermitedError';
import { FileAlreadyExistsError } from '../domain/errors/FileAlreadyExistsError';
import { FilePath } from '../domain/FilePath';
import { RemoteFileContentsRepository } from '../domain/RemoteFileContentsRepository';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';

export class WebdavFileRenamer {
  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly contentsRepository: RemoteFileContentsRepository,
    private readonly eventBus: WebdavServerEventBus
  ) {}

  private async rename(file: WebdavFile, path: FilePath) {
    file.rename(path);

    await this.repository.updateName(file);

    await this.eventBus.publish(file.pullDomainEvents());
  }

  private async reupload(file: WebdavFile, path: FilePath) {
    const clonnedFileId = await this.contentsRepository.clone(file);

    const uploaded = file.overwrite(clonnedFileId, file.folderId, path);

    file.trash();
    await this.repository.add(uploaded);
    await this.repository.delete(file);

    await this.eventBus.publish(uploaded.pullDomainEvents());
    await this.eventBus.publish(file.pullDomainEvents());
  }

  async run(file: WebdavFile, destination: string) {
    const path = new FilePath(destination);

    if (file.dirname !== path.dirname()) {
      throw new ActionNotPermitedError('rename and change folder');
    }

    const destinationFile = this.repository.search(path);

    if (destinationFile) {
      throw new FileAlreadyExistsError(destination);
    }

    if (path.extensionMatch(file.type)) {
      await this.rename(file, path);
    }

    await this.reupload(file, path);
  }
}
