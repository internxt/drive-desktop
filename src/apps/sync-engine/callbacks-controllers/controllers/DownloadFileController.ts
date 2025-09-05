import { ContentsDownloader } from '../../../../context/virtual-drive/contents/application/ContentsDownloader';
import { FilePlaceholderId } from '../../../../context/virtual-drive/files/domain/PlaceholderId';
import { trimPlaceholderId } from './placeholder-id';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { sleep } from '@/apps/main/util';
import { logger } from '@/apps/shared/logger/logger';
import { CallbackDownload } from '@/node-win/types/callbacks.type';

export class DownloadFileController {
  constructor(private readonly downloader: ContentsDownloader) {}

  private MAX_RETRY = 3;
  private RETRY_DELAY = 100;

  private async action(uuid: string, callback: CallbackDownload): Promise<string> {
    const file = await this.fileFinderByUuid({ uuid });

    return await this.downloader.run({ file, callback });
  }

  async fileFinderByUuid({ uuid }: { uuid: string }) {
    const { data: file } = await ipcRendererSqlite.invoke('fileGetByUuid', { uuid });
    if (!file) {
      throw new Error(`File ${uuid} not found`);
    }
    return file;
  }

  async execute(filePlaceholderId: FilePlaceholderId, callback: CallbackDownload): Promise<string> {
    const trimmedId = trimPlaceholderId({ placeholderId: filePlaceholderId });
    const [, uuid] = trimmedId.split(':');

    return await this.withRetries(() => this.action(uuid, callback));
  }
  private async withRetries<T>(action: () => Promise<T>): Promise<T> {
    for (let attempt = 1; attempt <= this.MAX_RETRY; attempt++) {
      try {
        return await action();
      } catch (error) {
        logger.error({ msg: `Attempt ${attempt} failed:`, error });
        if (attempt === this.MAX_RETRY) {
          throw logger.error({ msg: 'Max retries reached. Throwing error.' });
        }
        await sleep(this.RETRY_DELAY);
      }
    }
    throw new Error('Unexpected end of retry loop');
  }

  cancel() {
    this.downloader.stop();
  }
}
