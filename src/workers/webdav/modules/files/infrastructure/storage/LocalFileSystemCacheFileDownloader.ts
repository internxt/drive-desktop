import { Readable } from 'stream';
import {
  ContentFileDownloader,
  FileDownloadEvents,
} from '../../domain/ContentFileDownloader';
import { LocalFileConentsRepository } from '../../domain/LocalFileContentsRepository';
import { WebdavFile } from '../../domain/WebdavFile';
import Logger from 'electron-log';

export class LocalFileSystemCacheFileDownloader
  implements ContentFileDownloader
{
  elapsedTime: () => number;
  on: (
    event: keyof FileDownloadEvents,
    handler: FileDownloadEvents[keyof FileDownloadEvents]
  ) => void;

  constructor(
    private readonly fileDownloader: ContentFileDownloader,
    private readonly localFileContentsRepository: LocalFileConentsRepository
  ) {
    this.on = fileDownloader.on.bind(fileDownloader);
    this.elapsedTime = fileDownloader.elapsedTime.bind(fileDownloader);
  }

  async download(file: WebdavFile): Promise<Readable> {
    const isCached = await this.localFileContentsRepository.exists(file.fileId);

    if (isCached) {
      return this.localFileContentsRepository.read(file.fileId);
    }

    const contents = await this.fileDownloader.download(file);

    this.localFileContentsRepository
      .write(file.fileId, contents)
      .catch((err) => {
        Logger.error(`Error storing a file into cache: ${err}`);
      });

    return contents;
  }
}
