import { Readable } from 'stream';
import {
  ContentFileDownloader,
  FileDownloadEvents,
} from '../../domain/ContentFileDownloader';
import { LocalFileConentsRepository } from '../../domain/LocalFileContentsRepository';
import { WebdavFile, WebdavFileAtributes } from '../../domain/WebdavFile';
import Logger from 'electron-log';

export class LocalFileSystemCacheFileDownloader
  implements ContentFileDownloader
{
  private readonly filesAccesTime = new Map<string, number>();

  elapsedTime: () => number;
  on: (
    event: keyof FileDownloadEvents,
    handler: FileDownloadEvents[keyof FileDownloadEvents]
  ) => void;

  constructor(
    private readonly fileDownloader: ContentFileDownloader,
    private readonly localFileContentsRepository: LocalFileConentsRepository,
    private readonly maxCacheSize: number
  ) {
    this.on = fileDownloader.on.bind(fileDownloader);
    this.elapsedTime = fileDownloader.elapsedTime.bind(fileDownloader);
  }

  private getOldestAccessedFile(): WebdavFileAtributes['fileId'] | undefined {
    if (this.filesAccesTime.size === 0) {
      return undefined;
    }

    let oldestTimestamp: number | null = null;
    let oldestId: string | null = null;

    for (const [id, accessed] of this.filesAccesTime) {
      if (oldestTimestamp === null || accessed < oldestTimestamp) {
        oldestTimestamp = accessed;
        oldestId = id;
      }
    }

    return oldestId || undefined;
  }

  private async cacheFile(file: WebdavFile, contents: Readable): Promise<void> {
    let usage = await this.localFileContentsRepository.usage();

    if (file.size > this.maxCacheSize) {
      Logger.info(`File ${file.fileId} is to large to be cached`);
      return;
    }

    while (
      usage + file.size >= this.maxCacheSize &&
      this.filesAccesTime.size > 0
    ) {
      const oldestAccessed = this.getOldestAccessedFile();

      if (oldestAccessed) {
        // eslint-disable-next-line no-await-in-loop
        await this.localFileContentsRepository.delete(oldestAccessed);

        this.filesAccesTime.delete(oldestAccessed);
      }

      // eslint-disable-next-line no-await-in-loop
      usage = await this.localFileContentsRepository.usage();
    }

    this.filesAccesTime.set(file.path.value, Date.now());

    this.localFileContentsRepository
      .write(file.fileId, contents)
      .catch((err) => {
        Logger.error(`Error storing a file into cache: ${err}`);
      });
  }

  async download(file: WebdavFile): Promise<Readable> {
    const isCached = await this.localFileContentsRepository.exists(file.fileId);

    if (isCached) {
      Logger.info(
        `File with id ${file.fileId} is cached. Skiping downloading it.`
      );
      return this.localFileContentsRepository.read(file.fileId);
    }

    const contents = await this.fileDownloader.download(file);

    await this.cacheFile(file, contents);

    return contents;
  }
}
