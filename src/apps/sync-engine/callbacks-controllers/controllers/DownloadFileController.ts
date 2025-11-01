import { ContentsDownloader } from '../../../../context/virtual-drive/contents/application/ContentsDownloader';
import { CallbackDownload } from '@/node-win/types/callbacks.type';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ProcessSyncContext } from '../../config';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

export class DownloadFileController {
  constructor(private readonly downloader: ContentsDownloader) {}

  async execute(ctx: ProcessSyncContext, file: SimpleDriveFile, path: AbsolutePath, callback: CallbackDownload) {
    return await this.downloader.run({ ctx, file, path, callback });
  }

  cancel({ ctx, path }: { ctx: ProcessSyncContext; path: AbsolutePath }) {
    ctx.logger.debug({ msg: 'Cencel fetch data callback', path });
    this.downloader.stop({ path });
  }
}
