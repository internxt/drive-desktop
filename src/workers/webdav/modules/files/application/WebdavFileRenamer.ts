import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';
import { ActionNotPermitedError } from '../domain/errors/ActionNotPermitedError';
import { FileAlreadyExistsError } from '../domain/errors/FileAlreadyExistsError';
import { FilePath } from '../domain/FilePath';
import { RemoteFileContentsManagersFactory } from '../domain/RemoteFileContentsManagersFactory';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';
import { WebdavIpc } from '../../../ipc';

export class WebdavFileRenamer {
  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly contentsRepository: RemoteFileContentsManagersFactory,
    private readonly eventBus: WebdavServerEventBus,
    private readonly ipc: WebdavIpc
  ) {}

  private async rename(file: WebdavFile, path: FilePath) {
    file.rename(path);

    await this.repository.updateName(file);

    await this.eventBus.publish(file.pullDomainEvents());
  }

  private async reupload(file: WebdavFile, path: FilePath) {
    const clonner = this.contentsRepository.clonner(file);

    const clonnedFileId = await clonner.clone();

    const uploaded = file.overwrite(clonnedFileId, file.folderId, path);

    file.trash();
    await this.repository.add(uploaded);
    await this.repository.delete(file);

    await this.eventBus.publish(uploaded.pullDomainEvents());
    await this.eventBus.publish(file.pullDomainEvents());
  }

  async run(file: WebdavFile, destination: string) {
    const path = new FilePath(destination);

    this.ipc.send('WEBDAV_FILE_RENAMING', {
      oldName: file.name,
      nameWithExtension: path.nameWithExtension(),
    });

    if (file.dirname !== path.dirname()) {
      this.ipc.send('WEBDAV_FILE_RENAME_ERROR', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        error: 'Renaming error: rename and change folder',
      });
      throw new ActionNotPermitedError('rename and change folder');
    }

    const destinationFile = this.repository.search(path);

    if (destinationFile) {
      this.ipc.send('WEBDAV_FILE_RENAME_ERROR', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        error: 'Renaming error: file already exists',
      });
      throw new FileAlreadyExistsError(destination);
    }

    if (path.extensionMatch(file.type)) {
      await this.rename(file, path);
      return;
    }

    await this.reupload(file, path);
  }
}
