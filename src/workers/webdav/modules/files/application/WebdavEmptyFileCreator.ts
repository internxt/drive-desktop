import { Writable } from 'stream';
import { WebdavIpc } from '../../../ipc';
import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';
import * as uuid from 'uuid';
import { WebdavFolderFinder } from '../../folders/application/WebdavFolderFinder';
import { FilePath } from '../domain/FilePath';

export class WebdavEmptyFileCreator {
  private static readonly EMPTY_FILE_SIZE = 0;

  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly folderFinder: WebdavFolderFinder,
    private readonly eventBus: WebdavServerEventBus,
    private readonly ipc: WebdavIpc
  ) {}

  async run(path: string): Promise<Writable> {
    const filePath = new FilePath(path);

    const folder = this.folderFinder.run(filePath.dirname());

    const file = WebdavFile.create(
      uuid.v4(),
      folder,
      WebdavEmptyFileCreator.EMPTY_FILE_SIZE,
      filePath
    );

    await this.repository.add(file);

    await this.eventBus.publish(file.pullDomainEvents());

    this.ipc.send('WEBDAV_FILE_CREATED', {
      name: file.name,
      extension: file.type,
      nameWithExtension: file.nameWithExtension,
      size: file.size,
    });

    return new Writable();
  }
}
