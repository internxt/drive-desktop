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
import { performance } from 'perf_hooks';
import { Stopwatch } from '../../../../../shared/types/Stopwatch';

export class WebdavFileCreator {
  private readonly stopwatch: Stopwatch;

  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly folderFinder: WebdavFolderFinder,
    private readonly contentsRepository: RemoteFileContentsRepository,
    private readonly temporalFileCollection: FileMetadataCollection,
    private readonly eventBus: WebdavServerEventBus,
    private readonly ipc: WebdavIpc
  ) {
    this.stopwatch = {};
  }

  private registerEvents(path: FilePath, uploader: ContentFileUploader) {
    uploader.on('start', () => {
      this.stopwatch.start = performance.now();

      this.ipc.send('WEBDAV_FILE_UPLOAD_PROGRESS', {
        name: path.nameWithExtension(),
        progess: 0,
        uploadInfo: { stopwatch: this.stopwatch },
      });
    });

    uploader.on('progress', (progess: number) => {
      this.ipc.send('WEBDAV_FILE_UPLOAD_PROGRESS', {
        name: path.nameWithExtension(),
        progess,
        uploadInfo: { stopwatch: this.stopwatch },
      });
    });

    uploader.on('finish', () => {
      this.stopwatch.finish = performance.now();
    });

    uploader.on('error', () => {
      //
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

    this.ipc.send('WEBDAV_FILE_UPLOADED', {
      name: file.name,
      type: file.type,
      size: file.size,
      uploadInfo: { stopwatch: this.stopwatch },
    });

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

    const uploader = this.contentsRepository.uploader(fileSize, stream);

    this.registerEvents(filePath, uploader);

    const upload = uploader.upload();

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
