import { Environment } from '@internxt/inxt-js';
import { Service } from 'diod';
import { FileDownloaderHandler } from '../../domain/download/FileDownloaderHandler';
import { FileDownloaderHandlerFactory } from '../../domain/download/FileDownloaderHandlerFactory';
import { EnvironmentContentFileDownloader } from './EnvironmentContentFileDownloader';

@Service()
export class EnvironmentFileDownloaderHandlerFactory
  implements FileDownloaderHandlerFactory
{
  constructor(
    private readonly environment: Environment,
    private readonly bucket: string
  ) {}

  downloader(): FileDownloaderHandler {
    return new EnvironmentContentFileDownloader(
      this.environment.download,
      this.bucket
    );
  }
}
