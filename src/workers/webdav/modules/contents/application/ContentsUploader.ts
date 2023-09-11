import { VirtualDriveIpc } from 'workers/webdav/ipc';
import { ItemMetadata } from '../../shared/domain/ItemMetadata';
import { ContentFileUploader } from '../domain/ContentFileUploader';
import { ContentsManagersFactory } from '../domain/ContentsManagersFactory';
import { LocalContentsProvider } from '../domain/LocalFileProvider';
import { ContentsId } from '../domain/ContentsId';
import { Contents } from '../domain/Contents';
import { FileContents } from '../domain/FileContents';

export class ContentsUploader {
  constructor(
    private readonly remoteContentsManagersFactory: ContentsManagersFactory,
    private readonly contentProvider: LocalContentsProvider,
    private readonly ipc: VirtualDriveIpc
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

  async run(absolutePath: string): Promise<FileContents> {
    const { contents, abortSignal, metadata } =
      this.contentProvider.provide(absolutePath);

    const uploader = this.remoteContentsManagersFactory.uploader(
      contents,
      abortSignal
    );

    this.registerEvents(uploader, metadata);

    const contentsId = await uploader.upload(contents.stream, contents.size);

    const fileContents = FileContents.create(contentsId, contents.size);

    return fileContents;
  }
}
