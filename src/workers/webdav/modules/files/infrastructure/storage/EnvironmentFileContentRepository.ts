import { Environment } from '@internxt/inxt-js';
import { Readable } from 'stream';
import { FileSize } from '../../domain/FileSize';
import { RemoteFileContentsRepository } from '../../domain/RemoteFileContentsRepository';
import { WebdavFile } from '../../domain/WebdavFile';
import { EnvironmentContentFileUpoader } from './EnvironmentContentFileUpoader';
import { EnvironmentContentFileDownloader } from './EnvironmentContnetFileDownloader';
import { ContentFileDownloader } from '../../domain/ContentFileDownloader';
import { ContentFileUploader } from '../../domain/ContentFileUploader';
import { EnvironmentContentFileClonner } from './EnvironmentContentFileClonner';
import { ContentFileClonner } from '../../domain/ContentFileClonner';
import { LocalFileSystemCacheFileDownloader } from './LocalFileSystemCacheFileDownloader';
import { NodeFSLocalFileContentsRepository } from './NodeFSLocalFileContentsRepository';
import { app } from 'electron';

const TWO_GIGABYTE = 2 * 1024 * 1024 * 1024;

export class EnvironmentFileContentRepository
  implements RemoteFileContentsRepository
{
  private static MULTIPART_UPLOADE_SIZE_THRESHOLD = 5 * 1024 * 1024 * 1024;

  constructor(
    private readonly environment: Environment,
    private readonly bucket: string
  ) {}

  clonner(file: WebdavFile): ContentFileClonner {
    const uploadFunciton =
      file.size >
      EnvironmentFileContentRepository.MULTIPART_UPLOADE_SIZE_THRESHOLD
        ? this.environment.uploadMultipartFile
        : this.environment.upload;

    const clonner = new EnvironmentContentFileClonner(
      uploadFunciton,
      this.environment.download,
      this.bucket,
      file
    );

    return clonner;
  }

  downloader(): ContentFileDownloader {
    const environmentDownloader = new EnvironmentContentFileDownloader(
      this.environment.download,
      this.bucket
    );

    const cacheFolder = app.getPath('userData');

    const localFileSystemRepository = new NodeFSLocalFileContentsRepository(
      cacheFolder
    );

    localFileSystemRepository.initialize();

    return new LocalFileSystemCacheFileDownloader(
      environmentDownloader,
      localFileSystemRepository,
      TWO_GIGABYTE
    );
  }

  uploader(size: FileSize, contents: Readable): ContentFileUploader {
    const fn =
      size.value >
      EnvironmentFileContentRepository.MULTIPART_UPLOADE_SIZE_THRESHOLD
        ? this.environment.uploadMultipartFile
        : this.environment.upload;

    return new EnvironmentContentFileUpoader(
      fn,
      this.bucket,
      size.value,
      Promise.resolve(contents)
    );
  }
}
