import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';
import { ActionNotPermitedError } from '../domain/errors/ActionNotPermitedError';
import { FileAlreadyExistsError } from '../domain/errors/FileAlreadyExistsError';
import { FilePath } from '../domain/FilePath';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';
import { WebdavIpc } from '../../../ipc';

export class WebdavFileRenamer {
  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly eventBus: WebdavServerEventBus,
    private readonly ipc: WebdavIpc
  ) {}

  async run(file: WebdavFile, destination: string) {
    const path = new FilePath(destination);
    this.ipc.send('WEBDAV_FILE_RENAMING', {
      oldName: file.name,
      nameWithExtension: path.nameWithExtension()
    });

    if (file.dirname !== path.dirname()) {
      this.ipc.send('WEBDAV_FILE_RENAME_ERROR', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        error: 'Renaming error: rename and change folder'
      });
      throw new ActionNotPermitedError('rename and change folder');
    }

    const destinationFile = this.repository.search(path);

    if (destinationFile) {
      this.ipc.send('WEBDAV_FILE_RENAME_ERROR', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        error: 'Renaming error: file already exists'
      });
      throw new FileAlreadyExistsError(destination);
    }

    try {
      file.rename(path);

      await this.repository.updateName(file);

      await this.eventBus.publish(file.pullDomainEvents());

      this.ipc.send('WEBDAV_FILE_RENAMED', {
        oldName: file.name,
        nameWithExtension: path.nameWithExtension()
      });
    } catch (err) {
      this.ipc.send('WEBDAV_FILE_RENAME_ERROR', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        error: 'Renaming error: ' + err
      });
    }
  }
}
