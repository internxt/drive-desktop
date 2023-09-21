import { ContentsDownloader } from '../../modules/contents/application/ContentsDownloader';
import { FileFinderByContentsId } from '../../modules/files/application/FileFinderByContentsId';
import { LocalRepositoryRepositoryRefresher } from '../../modules/files/application/LocalRepositoryRepositoryRefresher';
import { CallbackController } from './CallbackController';

export class DownloadFileController extends CallbackController {
  constructor(
    private readonly fileFinder: FileFinderByContentsId,
    private readonly downloader: ContentsDownloader,
    private readonly localRepositoryRefresher: LocalRepositoryRepositoryRefresher
  ) {
    super();
  }

  private async action(id: string) {
    const file = this.fileFinder.run(id);

    return await this.downloader.run(file);
  }

  async execute(contentsId: string): Promise<string> {
    const trimmedId = this.trim(contentsId);

    try {
      return await this.action(trimmedId);
    } catch {
      await this.localRepositoryRefresher.run();

      return await new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            const result = await this.action(trimmedId);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, 100);
      });
    }
  }
}
