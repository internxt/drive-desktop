import { PassThrough, Writable } from 'stream';
import { WebdavFolderFinder } from 'workers/webdav/folders/application/WebdavFolderFinder';
import { FilePath } from '../domain/FilePath';
import { FileContentRepository } from '../domain/storage/FileContentRepository';
import { ItemMetadata } from '../../shared/domain/ItemMetadata';
import { FileMetadataCollection } from '../domain/FileMetadataCollection';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';
import { WebdavFolder } from 'workers/webdav/folders/domain/WebdavFolder';

export class WebdavFileCreator {
  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly folderFinder: WebdavFolderFinder,
    private readonly contentsRepository: FileContentRepository,
    private readonly temporalFileCollection: FileMetadataCollection
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

    return file;
  }

  async run(path: string, size: number): Promise<Writable> {
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

    const upload = this.contentsRepository.upload(size, stream);

    upload
      .then(async (fileId) => {
        return this.createFileEntry(fileId, folder, size, filePath);
      })
      .catch(() => {
        // TODO: comunicate somehow this error happened
      });

    return stream;
  }
}
