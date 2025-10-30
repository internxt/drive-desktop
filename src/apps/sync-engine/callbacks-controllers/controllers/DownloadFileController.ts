import { ContentsDownloader } from '../../../../context/virtual-drive/contents/application/ContentsDownloader';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { sleep } from '@/apps/main/util';
import { logger } from '@/apps/shared/logger/logger';
import { CallbackDownload } from '@/node-win/types/callbacks.type';
import { FileUuid, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';

export class DownloadFileController {
  constructor(private readonly downloader: ContentsDownloader) {}

  private MAX_RETRY = 3;
  private RETRY_DELAY = 100;

  async fileFinderByUuid({ uuid }: { uuid: FileUuid }) {
    const { data: file, error } = await ipcRendererSqlite.invoke('fileGetByUuid', { uuid });
    if (error) throw error;
    return file;
  }

  async execute(file: SimpleDriveFile, callback: CallbackDownload) {
    for (let attempt = 1; attempt <= this.MAX_RETRY; attempt++) {
      try {
        return await this.downloader.run({ file, callback });
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
