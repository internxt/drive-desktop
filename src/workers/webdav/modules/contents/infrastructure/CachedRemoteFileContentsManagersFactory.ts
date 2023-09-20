import { ContentFileCloner } from '../domain/contentHandlers/ContentFileCloner';
import { ContentFileDownloader } from '../domain/contentHandlers/ContentFileDownloader';
import { ContentFileUploader } from '../domain/contentHandlers/ContentFileUploader';
import { ContentsCacheRepository } from '../domain/ContentsCacheRepository';
import { ContentsManagersFactory } from '../domain/ContentsManagersFactory';
import { CachedContentFileDownloader } from './download/CachedContentFileDownloader';
import { CachedContentFileUploader } from './upload/CachedContentFileUploader';
import { File } from '../../files/domain/File';
import { LocalFileContents } from '../domain/LocalFileContents';

export class CachedRemoteFileContentsManagersFactory
  implements ContentsManagersFactory
{
  constructor(
    private readonly repository: ContentsCacheRepository,
    private readonly factory: ContentsManagersFactory
  ) {}

  downloader(): ContentFileDownloader {
    return new CachedContentFileDownloader(
      this.factory.downloader(),
      this.repository
    );
  }

  uploader(
    contents: LocalFileContents,
    abortSignal?: AbortSignal
  ): ContentFileUploader {
    return new CachedContentFileUploader(
      this.factory.uploader(contents, abortSignal),
      this.repository
    );
  }

  cloner(file: File): ContentFileCloner {
    return this.cloner(file);
  }
}
