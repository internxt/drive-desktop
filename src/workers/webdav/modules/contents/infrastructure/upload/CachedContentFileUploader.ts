import { Readable } from 'stream';
import Logger from 'electron-log';
import {
  ContentFileUploader,
  FileUploadEvents,
} from '../../domain/contentHandlers/ContentFileUploader';
import { ContentsCacheRepository } from '../../domain/ContentsCacheRepository';
import { ContentsId } from '../../domain/ContentsId';

export class CachedContentFileUploader implements ContentFileUploader {
  elapsedTime: () => number;
  on: (
    event: keyof FileUploadEvents,
    handler: FileUploadEvents[keyof FileUploadEvents]
  ) => void;

  constructor(
    private readonly uploader: ContentFileUploader,
    private readonly localFileContentsRepository: ContentsCacheRepository
  ) {
    this.on = uploader.on.bind(uploader);
    this.elapsedTime = uploader.elapsedTime.bind(uploader);
  }

  async upload(contents: Readable, size: number): Promise<ContentsId> {
    const id = await this.uploader.upload(contents, size);

    this.localFileContentsRepository
      .write(id.value, contents, size)
      .catch((error) => {
        Logger.error('Error caching file: ', id, error);
      });

    return id;
  }
}
