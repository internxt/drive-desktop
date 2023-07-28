import { PassThrough, Readable, Writable } from 'stream';
import { WebdavFolderFinder } from '../../folders/application/WebdavFolderFinder';
import { FilePath } from '../domain/FilePath';
import { RemoteFileContentsManagersFactory } from '../domain/RemoteFileContentsManagersFactory';
import { ItemMetadata } from '../../shared/domain/ItemMetadata';
import { FileMetadataCollection } from '../domain/FileMetadataCollection';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';
import { WebdavFolder } from '../../folders/domain/WebdavFolder';
import { FileSize } from '../domain/FileSize';
import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';
import { ContentFileUploader } from '../domain/ContentFileUploader';
import { WebdavIpc } from '../../../ipc';
import { ipcRenderer } from 'electron';
import { join } from 'path';
import * as fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import Logger from 'electron-log';
import { WebdavFileValidator } from './WebdavFileValidator';
export class WebdavFileCreator {
  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly folderFinder: WebdavFolderFinder,
    private readonly remoteContentsManagersFactory: RemoteFileContentsManagersFactory,
    private readonly temporalFileCollection: FileMetadataCollection,
    private readonly eventBus: WebdavServerEventBus,
    private readonly ipc: WebdavIpc
  ) {}

  private registerEvents(
    uploader: ContentFileUploader,
    metadata: ItemMetadata
  ) {
    uploader.on('start', () => {
      this.ipc.send('WEBDAV_FILE_UPLOADING', {
        name: metadata.name,
        extension: metadata.extension,
        nameWithExtension:
          metadata.name +
          (metadata.extension.length >= 0 ? '.' + metadata.extension : ''),
        size: metadata.size,
        processInfo: { elapsedTime: uploader.elapsedTime() },
      });
    });

    uploader.on('progress', (progress: number) => {
      this.ipc.send('WEBDAV_FILE_UPLOADING', {
        name: metadata.name,
        extension: metadata.extension,
        nameWithExtension:
          metadata.name +
          (metadata.extension.length >= 0 ? '.' + metadata.extension : ''),
        size: metadata.size,
        processInfo: { elapsedTime: uploader.elapsedTime(), progress },
      });
    });

    uploader.on('error', (error: Error) => {
      this.ipc.send('WEBDAV_FILE_UPLOAD_ERROR', {
        name: metadata.name,
        extension: metadata.extension,
        nameWithExtension:
          metadata.name +
          (metadata.extension.length >= 0 ? '.' + metadata.extension : ''),
        error: error.message,
      });
    });

    uploader.on('finish', () => {
      this.ipc.send('WEBDAV_FILE_UPLOADED', {
        name: metadata.name,
        extension: metadata.extension,
        nameWithExtension:
          metadata.name +
          (metadata.extension.length >= 0 ? '.' + metadata.extension : ''),
        size: metadata.size,
        processInfo: { elapsedTime: uploader.elapsedTime() },
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

  async run(path: string): Promise<{ stream: Writable }> {
    const filePath = new FilePath(path);

    const fileValidator = new WebdavFileValidator();

    const isValid = fileValidator.validateName(filePath.nameWithExtension());

    // Invalid files goes nowhere
    if (!isValid) return { stream: new PassThrough() };

    const userDataPath = await ipcRenderer.invoke('get-path', 'userData');

    const tmpUploads = join(userDataPath, 'tmp_uploads');

    await fs.mkdir(tmpUploads, {
      recursive: true,
    });

    const tmpUploadFilePath = join(tmpUploads, filePath.nameWithExtension());

    const writeStream = createWriteStream(tmpUploadFilePath);

    const cleanUp = () => fs.unlink(tmpUploadFilePath);

    const folder = this.folderFinder.run(filePath.dirname());

    const runUpload = async (readable: Readable, size: number) => {
      let metadata: ItemMetadata | null = null;
      try {
        metadata = ItemMetadata.from({
          createdAt: Date.now(),
          updatedAt: Date.now(),
          name: filePath.name(),
          size,
          extension: filePath.extension(),
          type: 'FILE',
        });

        this.temporalFileCollection.add(filePath.value, metadata);
        const uploader = this.remoteContentsManagersFactory.uploader(
          new FileSize(size)
        );

        this.registerEvents(uploader, metadata);

        const fileId = await uploader.upload(readable, size);

        await this.createFileEntry(fileId, folder, size, filePath);
      } catch (error) {
        this.ipc.send('WEBDAV_FILE_UPLOAD_ERROR', {
          name: filePath.name(),
          extension: filePath.extension(),
          nameWithExtension: filePath.nameWithExtension(),
          error: (error as Error).message,
        });
      } finally {
        cleanUp().catch((err) => {
          Logger.error('Failed to cleanup tmp uploaded file', err);
        });
      }
    };

    /**
     * We write the file to a tmp, then access that file
     * in order to do the upload since MacOS doesn't provide
     * us the file size
     */
    writeStream.on('close', () => {
      fs.stat(tmpUploadFilePath).then((stat) => {
        if (stat.size > 0) {
          const readStream = createReadStream(tmpUploadFilePath);
          runUpload(readStream, stat.size);
        } else {
          Logger.info('Ignoring file since it has 0 bytes size');
        }
      });
    });

    return { stream: writeStream };
  }
}
