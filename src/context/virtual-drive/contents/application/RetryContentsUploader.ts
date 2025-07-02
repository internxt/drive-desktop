import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { RemoteFileContents } from '../domain/RemoteFileContents';
import { ContentsUploader } from './ContentsUploader';
import Logger from 'electron-log';
import { logger } from '@/apps/shared/logger/logger';

function getFormattedFileSize(error: { context?: { fileSize?: number } }): string {
  const fileSize = error?.context?.fileSize;
  if (typeof fileSize !== 'number') return '';

  const mb = fileSize / 1048576;
  const mbRounded = parseFloat(mb.toFixed(2));

  if (mbRounded === 0) {
    const kb = fileSize / 1024;
    const kbRounded = parseFloat(kb.toFixed(2));
    return `${kbRounded} KB`;
  }

  return `${mbRounded} MB`;
}

// TODO: the retry logic should be on the infrastructure layer
// change the uploader factory method to revive a function that returns the needed data
export class RetryContentsUploader {
  private static NUMBER_OF_RETRIES = 1;
  private static MILLISECOND_BETWEEN_TRIES = 1_000;
  private static INITIAL_DELAY = 50;

  constructor(private readonly uploader: ContentsUploader) {}

  async retryUpload(asyncFunction: () => Promise<RemoteFileContents>) {
    let retryCount = 0;
    let skipRetry = false;
    let rejectionReason = '';

    while (retryCount <= RetryContentsUploader.NUMBER_OF_RETRIES) {
      try {
        const result = await asyncFunction();
        return result;
      } catch (error_: unknown) {
        if (error_ instanceof Error) {
          const error = error_ as Error & { fileName?: string; context?: { fileSize?: number } };

          if (error?.message == 'Max space used') {
            const errorMensage = `The storage limit for your account has been reached. The file '${error?.fileName} ${getFormattedFileSize(error)}' cannot be uploaded. Consider upgrading your plan for additional space.`;
            rejectionReason = '\n Reason: Max space used';
            ipcRendererSyncEngine.send('ADD_SYNC_ISSUE', {
              name: errorMensage,
              error: 'NOT_ENOUGH_SPACE',
            });
            // if the number of retries is reached, we should skip the retry
            skipRetry = true;
          }
          Logger.warn(`Upload attempt ${retryCount + 1} failed: ${error.message}`);
        } else {
          Logger.warn(`Upload attempt ${retryCount + 1} failed with an unknown error.`);
        }

        await new Promise((resolve) => {
          setTimeout(resolve, RetryContentsUploader.MILLISECOND_BETWEEN_TRIES);
        });

        if (skipRetry) {
          retryCount = RetryContentsUploader.NUMBER_OF_RETRIES + 1;
          break;
        } else {
          retryCount++;
        }
      }
    }
    throw new Error(`Max retries (${RetryContentsUploader.NUMBER_OF_RETRIES}) reached. Upload still failed.${rejectionReason}`);
  }

  /**
   * v2.5.6 Daniel Jiménez
   * TODO: add bottleneck here
   */
  async run(posixRelativePath: string): Promise<RemoteFileContents> {
    await new Promise((resolve) => {
      setTimeout(resolve, RetryContentsUploader.INITIAL_DELAY);
    });

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Upload file',
      posixRelativePath,
    });

    const upload = () => this.uploader.run(posixRelativePath);

    return this.retryUpload(upload);
  }
}
