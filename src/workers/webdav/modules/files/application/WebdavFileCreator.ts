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
import { ContentFileUploader } from '../domain/ContentFileUploader';
import { WebdavIpc } from '../../../ipc';
import { Stopwatch } from '../../../../../shared/types/Stopwatch';

export class WebdavFileCreator {
  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly folderFinder: WebdavFolderFinder,
    private readonly contentsRepository: RemoteFileContentsRepository,
    private readonly temporalFileCollection: FileMetadataCollection,
    private readonly eventBus: WebdavServerEventBus,
    private readonly ipc: WebdavIpc
  ) {}

  private registerEvents(
    uploader: ContentFileUploader,
    metadata: ItemMetadata
  ) {
    const stopwatch = new Stopwatch();

    uploader.on('start', () => {
      stopwatch.start();

      this.ipc.send('WEBDAV_FILE_UPLOAD_PROGRESS', {
        name: metadata.name,
        progess: 0,
        uploadInfo: { elapsedTime: stopwatch.elapsedTime() },
      });
    });

    uploader.on('progress', (progess: number) => {
      this.ipc.send('WEBDAV_FILE_UPLOAD_PROGRESS', {
        name: metadata.name,
        progess,
        uploadInfo: { elapsedTime: stopwatch.elapsedTime() },
      });
    });

    uploader.on('finish', () => {
      stopwatch.finish();

      this.ipc.send('WEBDAV_FILE_UPLOADED', {
        name: metadata.name,
        type: metadata.type,
        size: metadata.size,
        uploadInfo: { elapsedTime: stopwatch.elapsedTime() },
      });
    });
  }

  private async createFileEntry(
    fileId: string,
    folder: WebdavFolder,
    size: number,
    filePath: FilePath
  ): Promise<WebdavFile> {
    const file = WebdavFile.create(fileId, folder, size, filePath);

    await this.repository.add(file);

    this.temporalFileCollection.remove(filePath.value);

    await this.eventBus.publish(file.pullDomainEvents());

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

    const metadata = ItemMetadata.from({
      createdAt: Date.now(),
      updatedAt: Date.now(),
      name: filePath.name(),
      size,
      extension: filePath.extension(),
      type: 'FILE',
    });

    this.temporalFileCollection.add(filePath.value, metadata);

    const folder = this.folderFinder.run(filePath.dirname());

    const stream = new PassThrough();

    const uploader = this.contentsRepository.uploader(fileSize, stream);

    this.registerEvents(uploader, metadata);

    const upload = uploader.upload();

    upload
      .then(async (fileId) => {
        return this.createFileEntry(fileId, folder, size, filePath);
      })
      .catch((error: Error) => {
        this.ipc.send('WEBDAV_FILE_UPLOADED_ERROR', {
          name: metadata.name,
          error: error.message,
        });
      });

    return {
      stream,
      upload,
    };
  }
}
