import { RemoteFileContents } from '../domain/RemoteFileContents';
import { ContentsUploader } from './ContentsUploader';
import Logger from 'electron-log';

export class RetryContentsUploader {
  private static NUMBER_OF_RETRIES = 1;
  private static MILLISECOND_BETWEEN_TRIES = 1_000;

  constructor(private readonly uploader: ContentsUploader) {}

  async retryUpload(asyncFunction: () => Promise<RemoteFileContents>) {
    let retryCount = 0;
    while (retryCount <= RetryContentsUploader.NUMBER_OF_RETRIES) {
      try {
        const result = await asyncFunction();
        return result;
      } catch (error: unknown) {
        if (error instanceof Error) {
          Logger.warn(
            `Upload attempt ${retryCount + 1} failed: ${error.message}`
          );
        } else {
          Logger.warn(
            `Upload attempt ${retryCount + 1} failed with an unknown error.`
          );
        }

        await new Promise((resolve) => {
          setTimeout(resolve, RetryContentsUploader.MILLISECOND_BETWEEN_TRIES);
        });

        retryCount++;
      }
    }
    throw new Error(
      `Max retries (${RetryContentsUploader.NUMBER_OF_RETRIES}) reached. Upload still failed.`
    );
  }

  run(absolutePath: string): Promise<RemoteFileContents> {
    const upload = () => this.uploader.run(absolutePath);

    return this.retryUpload(upload);
  }
}
