import { FilePath } from '../domain/FilePath';
import { ContentsManagersFactory } from '../../contents/domain/ContentsManagersFactory';
import { ItemMetadata } from '../../shared/domain/ItemMetadata';
import { File } from '../domain/File';
import { FileSize } from '../domain/FileSize';
import { ContentFileUploader } from '../../contents/domain/ContentFileUploader';
import { VirtualDriveIpc } from '../../../ipc';
import { FilePathFromAbsolutePathCreator } from './FilePathFromAbsolutePathCreator';
import { LocalContentsProvider } from '../../contents/domain/LocalFileProvider';

export class WebdavFileCreator {
  constructor(
    private readonly remoteContentsManagersFactory: ContentsManagersFactory,
    private readonly ipc: VirtualDriveIpc,
    private readonly relativePathCreator: FilePathFromAbsolutePathCreator,
    private readonly fileProvider: LocalContentsProvider
  ) {}

  private registerEvents(
    uploader: ContentFileUploader,
    filePath: FilePath,
    size: FileSize
  ) {
    const metadata = ItemMetadata.from({
      createdAt: Date.now(),
      updatedAt: Date.now(),
      name: filePath.name(),
      size: size.value,
      extension: filePath.extension(),
      type: 'FILE',
    });
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

  async run(absolutePath: string): Promise<Promise<File['contentsId']>> {
    const filePath = this.relativePathCreator.run(absolutePath);

    const { stream, size } = this.fileProvider.provide(absolutePath);

    const uploader = this.remoteContentsManagersFactory.uploader(size);

    this.registerEvents(uploader, filePath, size);

    const contentsId = await uploader.upload(stream, size);

    this.createFileEntry(contentsId, size, filePath);

    return contentsId;
  }
}
