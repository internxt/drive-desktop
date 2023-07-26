import { Readable } from 'stream';
import {
  ContentFileUploader,
  FileUploadEvents,
} from '../../../domain/ContentFileUploader';
import { ContentsCacheRepository } from '../../../domain/ContentsCacheRepository';
import Logger from 'electron-log';

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

  async upload(contents: Readable, size: number): Promise<string> {
    const id = await this.uploader.upload(contents, size);

    this.localFileContentsRepository
      .write(id, contents, size)
      .catch((error) => {
        Logger.error('Error caching file: ', id, error);
      });

    return id;
  }
}
