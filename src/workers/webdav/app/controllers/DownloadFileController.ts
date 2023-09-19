import { ContentsDownloader } from '../../modules/contents/application/ContentsDownloader';
import { FileFinderByContentsId } from '../../modules/files/application/FileFinderByContentsId';

export class DownloadFileController {
  constructor(
    private readonly fileFinder: FileFinderByContentsId,
    private readonly downloader: ContentsDownloader
  ) {}

  async execute(contentsId: string): Promise<string> {
    // eslint-disable-next-line no-control-regex
    const trimmedId = contentsId.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    const file = this.fileFinder.run(trimmedId);

    return await this.downloader.run(file);
  }
}
