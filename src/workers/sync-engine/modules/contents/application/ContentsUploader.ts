import { SyncEngineIpc } from 'workers/sync-engine/ipcRendererSyncEngine';
import { ContentFileUploader } from '../domain/contentHandlers/ContentFileUploader';
import { ContentsManagersFactory } from '../domain/ContentsManagersFactory';
import { LocalContentsProvider } from '../domain/LocalFileProvider';
import { RemoteFileContents } from '../domain/RemoteFileContents';
import { LocalFileContents } from '../domain/LocalFileContents';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';

export class ContentsUploader {
  constructor(
    private readonly remoteContentsManagersFactory: ContentsManagersFactory,
    private readonly contentProvider: LocalContentsProvider,
    private readonly ipc: SyncEngineIpc,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter
  ) {}

  private registerEvents(
    uploader: ContentFileUploader,
    localFileContents: LocalFileContents
  ) {
    uploader.on('start', () => {
      this.ipc.send('FILE_UPLOADING', {
        name: localFileContents.name,
        extension: localFileContents.extension,
        nameWithExtension: localFileContents.nameWithExtension,
        size: localFileContents.size,
        processInfo: { elapsedTime: uploader.elapsedTime() },
      });
    });

    uploader.on('progress', (progress: number) => {
      this.ipc.send('FILE_UPLOADING', {
        name: localFileContents.name,
        extension: localFileContents.extension,
        nameWithExtension: localFileContents.nameWithExtension,
        size: localFileContents.size,
        processInfo: { elapsedTime: uploader.elapsedTime(), progress },
      });
    });

    uploader.on('error', (error: Error) => {
      this.ipc.send('FILE_UPLOAD_ERROR', {
        name: localFileContents.name,
        extension: localFileContents.extension,
        nameWithExtension: localFileContents.nameWithExtension,
        error: error.message,
      });
    });

    uploader.on('finish', () => {
      this.ipc.send('FILE_UPLOADED', {
        name: localFileContents.name,
        extension: localFileContents.extension,
        nameWithExtension: localFileContents.nameWithExtension,
        size: localFileContents.size,
        processInfo: { elapsedTime: uploader.elapsedTime() },
      });
    });
  }

  async run(posixRelativePath: string): Promise<RemoteFileContents> {
    const win32RelativePath =
      PlatformPathConverter.posixToWin(posixRelativePath);

    const absolutePath =
      this.relativePathToAbsoluteConverter.run(win32RelativePath);

    const { contents, abortSignal } = await this.contentProvider.provide(
      absolutePath
    );

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
