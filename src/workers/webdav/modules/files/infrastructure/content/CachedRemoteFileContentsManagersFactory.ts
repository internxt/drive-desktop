import { ContentFileClonner } from '../../domain/ContentFileClonner';
import { ContentFileDownloader } from '../../domain/ContentFileDownloader';
import { ContentFileUploader } from '../../domain/ContentFileUploader';
import { FileSize } from '../../domain/FileSize';
import { RemoteFileContentsManagersFactory } from '../../domain/RemoteFileContentsManagersFactory';
import { WebdavFile } from '../../domain/WebdavFile';
import { ContentsCacheRepository } from '../../domain/ContentsCacheRepository';
import { CachedContentFileDownloader } from './download/CachedContentFileDownloader';
import { CachedContentFileUploader } from './upload/CachedContentFileUploader';

export class CachedRemoteFileContentsManagersFactory
  implements RemoteFileContentsManagersFactory
{
  constructor(
    private readonly repository: ContentsCacheRepository,
    private readonly factory: RemoteFileContentsManagersFactory
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

  clonner(file: WebdavFile): ContentFileClonner {
    return this.clonner(file);
  }
}
