import { FilePlaceholderId } from 'workers/sync-engine/modules/placeholders/domain/FilePlaceholderId';
import { ContentsDownloader } from '../../modules/contents/application/ContentsDownloader';
import { FileFinderByContentsId } from '../../modules/files/application/FileFinderByContentsId';
import { LocalRepositoryRepositoryRefresher } from '../../modules/files/application/LocalRepositoryRepositoryRefresher';
import { CallbackController } from './CallbackController';
import Logger from 'electron-log';

export class DownloadFileController extends CallbackController {
  constructor(
    private readonly fileFinder: FileFinderByContentsId,
    private readonly downloader: ContentsDownloader,
    private readonly localRepositoryRefresher: LocalRepositoryRepositoryRefresher
  ) {
    super();
  }

  private async action(id: string) {
    Logger.info('find file with id : ', id);
    const file = this.fileFinder.run(id);

    return await this.downloader.run(file);
  }

  async execute(contentsId: FilePlaceholderId): Promise<string> {
    const trimmedId = this.trim(contentsId);

    try {
      const [_, contentsId] = trimmedId.split(':');
      Logger.info('Downloading file: ', contentsId);
      return await this.action(contentsId);
    } catch (error: unknown) {
      Logger.error(
        'Error downloading a file, going to refresh and retry: ',
        error
      );
      await this.localRepositoryRefresher.run();

      return await new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            const [_, contentsId] = trimmedId.split(':');
            const result = await this.action(contentsId);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, 100);
      });
    }
  }
}
