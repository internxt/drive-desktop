import { Environment } from '@internxt/inxt-js';
import {
  OfflineContentUploader,
  OfflineContentsManagersFactory,
} from '../domain/OfflineContentsManagersFactory';
import { EnvironmentOfflineContentsUploader } from './EnvironmentOfflineContentsUploader';
import { OfflineContents } from '../domain/OfflineContents';
import { UploadProgressTracker } from '../../../shared/domain/UploadProgressTracker';
import { Readable } from 'stream';

export class EnvironmentOfflineContentsManagersFactory
  implements OfflineContentsManagersFactory
{
  private static MULTIPART_UPLOAD_SIZE_THRESHOLD = 5 * 1024 * 1024 * 1024;

  constructor(
    private readonly environment: Environment,
    private readonly bucket: string,
    private readonly progressTracker: UploadProgressTracker
  ) {}

  uploader(
    stream: Readable,
    contents: OfflineContents,
    {
      name,
      extension,
    }: {
      name: string;
      extension: string;
    },
    abortSignal?: AbortSignal
  ): OfflineContentUploader {
    const fn =
      contents.size >
      EnvironmentOfflineContentsManagersFactory.MULTIPART_UPLOAD_SIZE_THRESHOLD
        ? this.environment.uploadMultipartFile
        : this.environment.upload;

    const uploader = new EnvironmentOfflineContentsUploader(
      fn,
      this.bucket,
      abortSignal
    );

    uploader.on('start', () => {
      this.progressTracker.uploadStarted(name, extension, contents.size, {
        elapsedTime: uploader.elapsedTime(),
      });
    });

    uploader.on('progress', (progress: number) => {
      this.progressTracker.uploadProgress(name, extension, contents.size, {
        elapsedTime: uploader.elapsedTime(),
        percentage: progress,
      });
    });

    uploader.on('error', (error: Error) => {
      this.progressTracker.uploadError(name, extension, error.message);
    });

    uploader.on('finish', () => {
      this.progressTracker.uploadCompleted(name, extension, contents.size, {
        elapsedTime: uploader.elapsedTime(),
      });
    });

    return () => uploader.upload(stream, contents.size);
  }
}
