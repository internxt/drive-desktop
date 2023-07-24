import { Readable } from 'stream';
import { ContentFileClonner } from '../../domain/ContentFileClonner';
import { ContentFileDownloader } from '../../domain/ContentFileDownloader';
import { ContentFileUploader } from '../../domain/ContentFileUploader';
import { FileSize } from '../../domain/FileSize';
import { RemoteFileContentsManagersFactory } from '../../domain/RemoteFileContentsManagersFactory';
import { WebdavFile } from '../../domain/WebdavFile';
import { LocalFileConentsRepository } from '../../domain/LocalFileContentsRepository';
import { LocalFileSystemCacheFileDownloader } from './LocalFileSystemCacheFileDownloader';

export class CachedRemoteFileContentsManagersFactory
  implements RemoteFileContentsManagersFactory
{
  private static readonly DEFAULT_CACHE_SIZE = 2 * 1024 * 1024 * 1024;

  constructor(
    private readonly repository: LocalFileConentsRepository,
    private readonly factory: RemoteFileContentsManagersFactory,
    private readonly chacheSizeInBytes: number = CachedRemoteFileContentsManagersFactory.DEFAULT_CACHE_SIZE
  ) {}

  downloader(): ContentFileDownloader {
    return new LocalFileSystemCacheFileDownloader(
      this.factory.downloader(),
      this.repository,
      this.chacheSizeInBytes
    );
  }

  uploader(size: FileSize, contents: Readable): ContentFileUploader {
    return this.factory.uploader(size, contents);
  }

  clonner(file: WebdavFile): ContentFileClonner {
    return this.clonner(file);
  }
}
