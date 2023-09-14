import { ContentsDownloader } from '../../modules/contents/application/ContentsDownloader';
import { ReadLocalFileContentsToBuffer } from '../../modules/contents/application/ReadLocalFileContentsToBuffer';
import { FileFinderByContentsId } from '../../modules/files/application/FileFinderByContentsId';

export class DownloadFileController {
  constructor(
    private readonly fileFinder: FileFinderByContentsId,
    private readonly downloader: ContentsDownloader
  ) {}

  async execute(contentsId: string): Promise<Buffer> {
    // eslint-disable-next-line no-control-regex
    const trimedId = contentsId.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    const file = this.fileFinder.run(trimedId);

    const contents = await this.downloader.run(file);

    return await ReadLocalFileContentsToBuffer.run(contents);
  }
}
