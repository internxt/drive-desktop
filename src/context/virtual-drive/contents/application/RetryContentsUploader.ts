import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { RemoteFileContents } from '../domain/RemoteFileContents';
import { ContentsUploader } from './ContentsUploader';
import { logger } from '@/apps/shared/logger/logger';
import Bottleneck from 'bottleneck';
import { sleep } from '@/apps/main/util';

const limiter = new Bottleneck({ maxConcurrent: 7 });

const MILLISECOND_BETWEEN_TRIES = 5_000;

export class RetryContentsUploader {
  constructor(private readonly uploader: ContentsUploader) {}

  async retryUpload(path: string) {
    let retry = 1;

    while (retry <= 2) {
      try {
        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: 'Upload file',
          path,
          retry,
        });

        retry += 1;

        return await this.uploader.run(path);
      } catch (error) {
        if (error instanceof Error && error.message == 'Max space used') {
          logger.warn({
            tag: 'SYNC-ENGINE',
            msg: 'Upload attempt failed because of max space used',
            path,
          });

          ipcRendererSyncEngine.send('ADD_SYNC_ISSUE', {
            error: 'NOT_ENOUGH_SPACE',
            name: path,
          });
          break;
        } else {
          logger.error({
            tag: 'SYNC-ENGINE',
            msg: 'Upload attempt failed with an unknown error',
            path,
          });
        }

        await sleep(MILLISECOND_BETWEEN_TRIES);
      }
    }

    throw logger.error({ msg: 'Max retries reached. Upload still failed', path });
  }

  async run(path: string): Promise<RemoteFileContents> {
    return await limiter.schedule(() => this.retryUpload(path));
  }
}
