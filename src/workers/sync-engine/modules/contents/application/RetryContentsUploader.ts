import { RemoteFileContents } from '../domain/RemoteFileContents';
import { ContentsUploader } from './ContentsUploader';
import Logger from 'electron-log';

export class RetryContentsUploader {
  private static NUMBER_OF_RETRIES = 2;
  private static MILLISECOND_BETWEEN_TRIES = 1_000;
  private static INITIAL_DELAY = 100;

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

  async run(absolutePath: string): Promise<RemoteFileContents> {
    await new Promise((resolve) => {
      setTimeout(resolve, RetryContentsUploader.INITIAL_DELAY);
    });

    const upload = () => this.uploader.run(absolutePath);

    return this.retryUpload(upload);
  }
}
