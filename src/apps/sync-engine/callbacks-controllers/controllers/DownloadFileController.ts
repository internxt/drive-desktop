import Logger from 'electron-log';
import { ContentsDownloader } from '../../../../context/virtual-drive/contents/application/ContentsDownloader';
import { FileFinderByContentsId } from '../../../../context/virtual-drive/files/application/FileFinderByContentsId';
import { FilePlaceholderId } from '../../../../context/virtual-drive/files/domain/PlaceholderId';
import { CallbackDownload } from '../../BindingManager';
import { CallbackController } from './CallbackController';

export class DownloadFileController extends CallbackController {
  constructor(
    private readonly fileFinder: FileFinderByContentsId,
    private readonly downloader: ContentsDownloader
  ) {
    super();
  }

  private async action(id: string, cb: CallbackDownload): Promise<string> {
    const file = this.fileFinder.run(id);

    return await this.downloader.run(file, cb);
  }

  fileFinderByContentsId(contentsId: string) {
    return this.fileFinder.run(contentsId);
  }

  async execute(
    filePlaceholderId: FilePlaceholderId,
    cb: CallbackDownload
  ): Promise<string> {
    const trimmedId = this.trim(filePlaceholderId);

    try {
      const [_, contentsId] = trimmedId.split(':');
      return await this.action(contentsId, cb);
    } catch (error: unknown) {
      Logger.error(
        'Error downloading a file, going to refresh and retry: ',
        error
      );

      return await new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            const [_, contentsId] = trimmedId.split(':');
            Logger.debug('cb: ', cb);
            const result = await this.action(contentsId, cb);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, 100);
      });
    }
  }
}
