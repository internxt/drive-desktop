import { PassThrough, Writable } from 'stream';
import { WebdavFolderFinder } from '../../folders/application/WebdavFolderFinder';
import { FilePath } from '../domain/FilePath';
import { RemoteFileContentsRepository } from '../domain/RemoteFileContentsRepository';
import { ItemMetadata } from '../../shared/domain/ItemMetadata';
import { FileMetadataCollection } from '../domain/FileMetadataCollection';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';
import { WebdavFolder } from '../../folders/domain/WebdavFolder';
import { FileSize } from '../domain/FileSize';
import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';

export class WebdavFileCreator {
  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly folderFinder: WebdavFolderFinder,
    private readonly contentsRepository: RemoteFileContentsRepository,
    private readonly temporalFileCollection: FileMetadataCollection,
    private readonly eventBus: WebdavServerEventBus
  ) {}

  private async createFileEntry(
    fileId: string,
    folder: WebdavFolder,
    size: number,
    filePath: FilePath
  ): Promise<WebdavFile> {
    const file = WebdavFile.create(fileId, folder, size, filePath);

    await this.repository.add(file);

    this.temporalFileCollection.remove(filePath.value);

    this.eventBus.publish(file.pullDomainEvents());

    return file;
  }

  async run(
    path: string,
    size: number
  ): Promise<{
    stream: Writable;
    upload: Promise<WebdavFile['fileId']>;
  }> {
    const fileSize = new FileSize(size);
    const filePath = new FilePath(path);

    this.temporalFileCollection.add(
      filePath.value,
      ItemMetadata.from({
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: filePath.name(),
        size,
        extension: filePath.extension(),
        type: 'FILE',
      })
    );

    const folder = this.folderFinder.run(filePath.dirname());

    const stream = new PassThrough();

    const upload = this.contentsRepository.upload(fileSize, stream);

    upload
      .then(async (fileId) => {
        return this.createFileEntry(fileId, folder, size, filePath);
      })
      .catch(() => {
        // TODO: comunicate somehow this error happened
      });

    return {
      stream,
      upload,
    };
  }
}
