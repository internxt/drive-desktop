import { ContentFileUploader } from '../domain/contentHandlers/ContentFileUploader';
import { RemoteFileContents } from '../domain/RemoteFileContents';
import { LocalFileContents } from '../domain/LocalFileContents';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import { ipcRendererSyncEngine } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import Logger from 'electron-log';
import { EnvironmentRemoteFileContentsManagersFactory } from '../infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { FSLocalFileProvider } from '../infrastructure/FSLocalFileProvider';
export class ContentsUploader {
  constructor(
    private readonly remoteContentsManagersFactory: EnvironmentRemoteFileContentsManagersFactory,
    private readonly contentProvider: FSLocalFileProvider,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter,
  ) {}

  private registerEvents(uploader: ContentFileUploader, localFileContents: LocalFileContents) {
    uploader.on('start', () => {
      ipcRendererSyncEngine.send('FILE_UPLOADING', {
        name: localFileContents.name,
        extension: localFileContents.extension,
        nameWithExtension: localFileContents.nameWithExtension,
        size: localFileContents.size,
        processInfo: { elapsedTime: uploader.elapsedTime() },
      });
    });

    uploader.on('progress', (progress: number) => {
      ipcRendererSyncEngine.send('FILE_UPLOADING', {
        name: localFileContents.name,
        extension: localFileContents.extension,
        nameWithExtension: localFileContents.nameWithExtension,
        size: localFileContents.size,
        processInfo: { elapsedTime: uploader.elapsedTime(), progress },
      });
    });

    uploader.on('error', (error: Error) => {
      ipcRendererSyncEngine.send('FILE_UPLOAD_ERROR', {
        name: localFileContents.name,
        extension: localFileContents.extension,
        nameWithExtension: localFileContents.nameWithExtension,
        error: error.message,
      });
    });

    uploader.on('finish', () => {
      ipcRendererSyncEngine.send('FILE_UPLOADED', {
        name: localFileContents.name,
        extension: localFileContents.extension,
        nameWithExtension: localFileContents.nameWithExtension,
        size: localFileContents.size,
        processInfo: { elapsedTime: uploader.elapsedTime() },
      });
    });
  }

  async run(posixRelativePath: string): Promise<RemoteFileContents> {
    try {
      const win32RelativePath = PlatformPathConverter.posixToWin(posixRelativePath);

      const absolutePath = this.relativePathToAbsoluteConverter.run(win32RelativePath);

      const { contents, abortSignal } = await this.contentProvider.provide(absolutePath);

      const uploader = this.remoteContentsManagersFactory.uploader(contents, abortSignal);

      this.registerEvents(uploader, contents);

      const contentsId = await uploader.upload(contents.stream, contents.size);

      const fileContents = RemoteFileContents.create(contentsId, contents.size);

      return fileContents;
    } catch (error: unknown) {
      Logger.error('[ERROR DEBUG]', error);
      const fileName = posixRelativePath.split('/').pop() || posixRelativePath;
      if (error instanceof Error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any).fileName = fileName;
      }
      throw error;
    }
  }
}
