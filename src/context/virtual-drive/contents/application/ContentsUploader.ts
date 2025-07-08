import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import { EnvironmentRemoteFileContentsManagersFactory } from '../infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { FSLocalFileProvider } from '../infrastructure/FSLocalFileProvider';
import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { getUploadCallbacks } from '@/backend/features/local-sync/upload-file/upload-callbacks';

export class ContentsUploader {
  constructor(
    private readonly remoteContentsManagersFactory: EnvironmentRemoteFileContentsManagersFactory,
    private readonly contentProvider: FSLocalFileProvider,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter,
  ) {}

  async run(path: string) {
    try {
      const win32RelativePath = PlatformPathConverter.posixToWin(path);

      const absolutePath = this.relativePathToAbsoluteConverter.run(win32RelativePath) as AbsolutePath;

      const { contents, abortSignal } = await this.contentProvider.provide(absolutePath);

      const uploader = this.remoteContentsManagersFactory.uploader();

      const { data: contentsId, error } = await uploader.upload({
        readable: contents.stream,
        size: contents.size,
        path,
        abortSignal,
        callbacks: getUploadCallbacks({ path: absolutePath }),
      });

      if (error) throw error;

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
