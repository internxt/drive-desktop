import { ContentsDownloader } from '../../../../context/virtual-drive/contents/application/ContentsDownloader';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { CallbackDownload } from '@/node-win/types/callbacks.type';
import { FileUuid, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';

export class DownloadFileController {
  constructor(private readonly downloader: ContentsDownloader) {}

  async fileFinderByUuid({ uuid }: { uuid: FileUuid }) {
    const { data: file, error } = await ipcRendererSqlite.invoke('fileGetByUuid', { uuid });
    if (error) throw error;
    return file;
  }

  async execute(file: SimpleDriveFile, callback: CallbackDownload) {
    return await this.downloader.run({ file, callback });
  }

  cancel() {
    this.downloader.stop();
  }
}
