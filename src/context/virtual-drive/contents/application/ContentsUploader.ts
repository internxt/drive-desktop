import { LocalFileContents } from '../domain/LocalFileContents';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import { ipcRendererSyncEngine } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { EnvironmentRemoteFileContentsManagersFactory } from '../infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { FSLocalFileProvider } from '../infrastructure/FSLocalFileProvider';
import { logger } from '@/apps/shared/logger/logger';
import { EnvironmentContentFileUploader } from '../infrastructure/upload/EnvironmentContentFileUploader';

export class ContentsUploader {
  constructor(
    private readonly remoteContentsManagersFactory: EnvironmentRemoteFileContentsManagersFactory,
    private readonly contentProvider: FSLocalFileProvider,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter,
  ) {}

  private registerEvents(uploader: EnvironmentContentFileUploader, localFileContents: LocalFileContents) {
    uploader.on('start', () => {
      ipcRendererSyncEngine.send('FILE_UPLOADING', {
        nameWithExtension: localFileContents.nameWithExtension,
        progress: 0,
      });
    });

    uploader.on('progress', (progress: number) => {
      ipcRendererSyncEngine.send('FILE_UPLOADING', {
        nameWithExtension: localFileContents.nameWithExtension,
        progress,
      });
    });

    uploader.on('error', () => {
      ipcRendererSyncEngine.send('FILE_UPLOAD_ERROR', {
        nameWithExtension: localFileContents.nameWithExtension,
      });
    });

    uploader.on('finish', () => {
      ipcRendererSyncEngine.send('FILE_UPLOADED', {
        nameWithExtension: localFileContents.nameWithExtension,
      });
    });
  }

  async run(path: string) {
    try {
      const win32RelativePath = PlatformPathConverter.posixToWin(path);

      const absolutePath = this.relativePathToAbsoluteConverter.run(win32RelativePath);

      const { contents, abortSignal } = await this.contentProvider.provide(absolutePath);

      const uploader = this.remoteContentsManagersFactory.uploader(contents);

      this.registerEvents(uploader, contents);

      const contentsId = await uploader.upload({
        contents: contents.stream,
        size: contents.size,
        path,
        abortSignal,
      });

      return { id: contentsId, size: contents.size };
    } catch (error) {
      throw logger.error({
        msg: 'Contents uploader error',
        path,
        error,
      });
    }
  }
}
