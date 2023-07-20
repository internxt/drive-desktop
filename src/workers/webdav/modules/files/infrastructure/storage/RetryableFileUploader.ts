import { Readable } from 'stream';
import {
  ContentFileUploader,
  FileUploadEvents,
} from '../../domain/ContentFileUploader';
import { FileActionEventEmitter } from './FileActionEventEmitter';

export class RetryableFileUploader
  extends FileActionEventEmitter<FileUploadEvents>
  implements ContentFileUploader
{
  static readonly MAX_RETRIES: number = 3;
  static readonly DELAY_BETWEEN_RETRIES: number = 500;

  elapsedTime: () => number;

  constructor(private readonly contentFildeUploader: ContentFileUploader) {
    super();
    this.on = contentFildeUploader.on.bind(contentFildeUploader);
    this.elapsedTime =
      contentFildeUploader.elapsedTime.bind(contentFildeUploader);
  }

  private async retryWithDelay(
    maxAttempts: number,
    delayMs = 0,
    fn: () => Promise<string>
  ): Promise<string> {
    let attempts = 0;

    return new Promise<string>((resolve, reject) => {
      const tryCallAsyncFunction = async () => {
        try {
          const fileId = await fn();
          resolve(fileId);
        } catch (error) {
          attempts++;
          if (attempts <= maxAttempts) {
            setTimeout(tryCallAsyncFunction, delayMs);
          } else {
            reject(error);
          }
        }
      };

      tryCallAsyncFunction();
    });
  }

  async upload(size: number, source: Readable): Promise<string> {
    return this.retryWithDelay(
      RetryableFileUploader.MAX_RETRIES,
      RetryableFileUploader.DELAY_BETWEEN_RETRIES,
      () => this.contentFildeUploader.upload(size, source)
    );
  }
}
