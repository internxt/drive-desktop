import Logger from 'electron-log';
import { ContentsDownloader } from '../../../../context/virtual-drive/contents/application/ContentsDownloader';
import { FilePlaceholderId } from '../../../../context/virtual-drive/files/domain/PlaceholderId';
import { CallbackController } from './CallbackController';
import { CallbackDownload } from '../../BindingManager';
import { FileNotFoundError } from '@/context/virtual-drive/files/domain/errors/FileNotFoundError';
import { trimPlaceholderId } from './placeholder-id';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';

export class DownloadFileController extends CallbackController {
  constructor(private readonly downloader: ContentsDownloader) {
    super();
  }

  private MAX_RETRY = 3;
  private RETRY_DELAY = 100;

  private async action(uuid: string, callback: CallbackDownload): Promise<string> {
    const file = await this.fileFinderByUuid({ uuid });

    return await this.downloader.run(file, callback);
  }

  async fileFinderByUuid({ uuid }: { uuid: string }) {
    const { data: file } = await ipcRendererSqlite.invoke('fileGetByUuid', { uuid });
    if (!file) {
      throw new FileNotFoundError(uuid);
    }
    return file;
  }

  async execute(filePlaceholderId: FilePlaceholderId, callback: CallbackDownload): Promise<string> {
    const trimmedId = trimPlaceholderId({ placeholderId: filePlaceholderId });
    const [, uuid] = trimmedId.split(':');

    return await this.withRetries(() => this.action(uuid, callback), this.MAX_RETRY, this.RETRY_DELAY);
  }
  private async withRetries<T>(action: () => Promise<T>, maxRetries: number, delayMs: number): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await action();
      } catch (error) {
        Logger.error(`Attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          Logger.error('Max retries reached. Throwing error.');
          throw error;
        }
        await this.delay(delayMs);
      }
    }
    throw new Error('Unexpected end of retry loop');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  cancel() {
    this.downloader.stop();
  }
}
