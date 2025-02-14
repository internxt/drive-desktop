import Logger from 'electron-log';
import { FolderDeleter } from './FolderDeleter';
import { MaxRetriesDeletingFolderError } from '../domain/errors/MaxRetriesDeletingFolderError';

export class RetryFolderDeleter {
  private static NUMBER_OF_RETRIES = 2;
  private static MILLISECOND_BETWEEN_TRIES = 1_000;
  private static INITIAL_DELAY = 100;
  constructor(private readonly deleter: FolderDeleter) {}
  async retryDeleter(asyncFunction: () => Promise<any>) {
    let retryCount = 0;

    while (retryCount <= RetryFolderDeleter.NUMBER_OF_RETRIES) {
      try {
        const result = await asyncFunction();
        return result;
      } catch (error: unknown) {
        if (error instanceof Error) {
          Logger.warn(`Folder deleter attempt ${retryCount + 1} failed: ${error.message}`);
        } else {
          Logger.warn(`Folder deleter attempt ${retryCount + 1} failed with an unknown error.`);
        }

        await new Promise((resolve) => {
          setTimeout(resolve, RetryFolderDeleter.MILLISECOND_BETWEEN_TRIES);
        });

        retryCount++;
      }
    }
    throw new MaxRetriesDeletingFolderError(RetryFolderDeleter.NUMBER_OF_RETRIES);
  }

  async run(folder: string): Promise<any> {
    await new Promise((resolve) => {
      setTimeout(resolve, RetryFolderDeleter.INITIAL_DELAY);
    });

    const deleter = () => this.deleter.run(folder);
    return this.retryDeleter(deleter);
  }
}
