import Logger from 'electron-log';
import { ContentsDownloader } from '../../../../context/virtual-drive/contents/application/ContentsDownloader';
import { FilePlaceholderId } from '../../../../context/virtual-drive/files/domain/PlaceholderId';
import { CallbackController } from './CallbackController';
import { CallbackDownload } from '../../BindingManager';
import { InMemoryFileRepository } from '@/context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { FileNotFoundError } from '@/context/virtual-drive/files/domain/errors/FileNotFoundError';
import { trimPlaceholderId } from './placeholder-id';
import { sleep } from '@/apps/main/util';

export class DownloadFileController extends CallbackController {
  constructor(
    private readonly downloader: ContentsDownloader,
    private readonly repository: InMemoryFileRepository,
  ) {
    super();
  }

  private MAX_RETRY = 3;
  private RETRY_DELAY = 100;

  private async action(uuid: string, callback: CallbackDownload): Promise<string> {
    const file = this.fileFinderByUuid({ uuid });

    Logger.info('[Begin] Download: ', file.path);
    return await this.downloader.run(file, callback);
  }

  fileFinderByUuid({ uuid }: { uuid: string }) {
    const file = this.repository.searchByPartial({ uuid });
    if (!file) {
      throw new FileNotFoundError(uuid);
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
        Logger.error(`Attempt ${attempt} failed:`, error);
        if (attempt === this.MAX_RETRY) {
          Logger.error('Max retries reached. Throwing error.');
          throw error;
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
