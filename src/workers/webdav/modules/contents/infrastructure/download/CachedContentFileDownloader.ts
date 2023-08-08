import { Readable } from 'stream';
import { File } from '../../../files/domain/File';
import Logger from 'electron-log';
import {
  ContentFileDownloader,
  FileDownloadEvents,
} from '../../domain/ContentFileDownloader';
import { ContentsCacheRepository } from '../../domain/ContentsCacheRepository';

export class CachedContentFileDownloader implements ContentFileDownloader {
  elapsedTime: () => number;
  on: (
    event: keyof FileDownloadEvents,
    handler: FileDownloadEvents[keyof FileDownloadEvents]
  ) => void;

  constructor(
    private readonly fileDownloader: ContentFileDownloader,
    private readonly cachedRepository: ContentsCacheRepository
  ) {
    this.on = fileDownloader.on.bind(fileDownloader);
    this.elapsedTime = fileDownloader.elapsedTime.bind(fileDownloader);
  }

  async download(file: File): Promise<Readable> {
    const isCached = await this.cachedRepository.exists(file.contentsId);

    if (isCached) {
      Logger.info(
        `File with id ${file.contentsId} is cached. Skiping downloading it.`
      );
      return this.cachedRepository.read(file.contentsId);
    }

    const contents = await this.fileDownloader.download(file);

    this.cachedRepository
      .write(file.contentsId, contents, file.size)
      .catch((error) => {
        Logger.error('Error caching file: ', file.contentsId, error);
      });

    return contents;
  }
}
