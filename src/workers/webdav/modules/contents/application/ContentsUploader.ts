import { VirtualDriveIpc } from 'workers/webdav/ipc';
import { ContentFileUploader } from '../domain/contentHandlers/ContentFileUploader';
import { ContentsManagersFactory } from '../domain/ContentsManagersFactory';
import { LocalContentsProvider } from '../domain/LocalFileProvider';
import { RemoteFileContents } from '../domain/RemoteFileContents';
import { LocalFileContents } from '../domain/LocalFileContents';

export class ContentsUploader {
  constructor(
    private readonly remoteContentsManagersFactory: ContentsManagersFactory,
    private readonly contentProvider: LocalContentsProvider,
    private readonly ipc: VirtualDriveIpc
  ) {}

  private registerEvents(
    uploader: ContentFileUploader,
    localFileContents: LocalFileContents
  ) {
    uploader.on('start', () => {
      this.ipc.send('WEBDAV_FILE_UPLOADING', {
        name: localFileContents.name,
        extension: localFileContents.extension,
        nameWithExtension: localFileContents.nameWithExtension,
        size: localFileContents.size,
        processInfo: { elapsedTime: uploader.elapsedTime() },
      });
    });

    uploader.on('progress', (progress: number) => {
      this.ipc.send('WEBDAV_FILE_UPLOADING', {
        name: localFileContents.name,
        extension: localFileContents.extension,
        nameWithExtension: localFileContents.nameWithExtension,
        size: localFileContents.size,
        processInfo: { elapsedTime: uploader.elapsedTime(), progress },
      });
    });

    uploader.on('error', (error: Error) => {
      this.ipc.send('WEBDAV_FILE_UPLOAD_ERROR', {
        name: localFileContents.name,
        extension: localFileContents.extension,
        nameWithExtension: localFileContents.nameWithExtension,
        error: error.message,
      });
    });

    uploader.on('finish', () => {
      this.ipc.send('WEBDAV_FILE_UPLOADED', {
        name: localFileContents.name,
        extension: localFileContents.extension,
        nameWithExtension: localFileContents.nameWithExtension,
        size: localFileContents.size,
        processInfo: { elapsedTime: uploader.elapsedTime() },
      });
    });
  }

  async run(absolutePath: string): Promise<RemoteFileContents> {
    const { contents, abortSignal } =
      this.contentProvider.provide(absolutePath);

    const uploader = this.remoteContentsManagersFactory.uploader(
      contents,
      abortSignal
    );

    this.registerEvents(uploader, contents);

    const contentsId = await uploader.upload(contents.stream, contents.size);

    const fileContents = RemoteFileContents.create(contentsId, contents.size);

    return fileContents;
  }
}
