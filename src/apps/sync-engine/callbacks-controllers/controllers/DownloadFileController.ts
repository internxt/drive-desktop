import { ContentsDownloader } from '../../../../context/virtual-drive/contents/application/ContentsDownloader';
import { CallbackDownload } from '@/node-win/types/callbacks.type';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';

export class DownloadFileController {
  constructor(private readonly downloader: ContentsDownloader) {}

  async execute(file: SimpleDriveFile, callback: CallbackDownload) {
    return await this.downloader.run({ file, callback });
  }

  cancel() {
    this.downloader.stop();
  }
}
