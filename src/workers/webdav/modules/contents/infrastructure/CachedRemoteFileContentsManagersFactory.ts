import { FileSize } from '../../files/domain/FileSize';
import { ContentFileClonner } from '../domain/ContentFileClonner';
import { ContentFileDownloader } from '../domain/ContentFileDownloader';
import { ContentFileUploader } from '../domain/ContentFileUploader';
import { ContentsCacheRepository } from '../domain/ContentsCacheRepository';
import { ContentsManagersFactory } from '../domain/ContentsManagersFactory';
import { CachedContentFileDownloader } from './download/CachedContentFileDownloader';
import { CachedContentFileUploader } from './upload/CachedContentFileUploader';
import { File } from '../../files/domain/File';

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

  uploader(size: FileSize): ContentFileUploader {
    return new CachedContentFileUploader(
      this.factory.uploader(size),
      this.repository
    );
  }

  clonner(file: File): ContentFileClonner {
    return this.clonner(file);
  }
}
