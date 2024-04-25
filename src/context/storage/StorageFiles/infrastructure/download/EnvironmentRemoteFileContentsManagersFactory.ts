import { Environment } from '@internxt/inxt-js';
import { Service } from 'diod';
import { DownloaderHandler } from '../../domain/download/DownloaderHandler';
import { DownloaderHandlerFactory } from '../../domain/download/DownloaderHandlerFactory';
import { EnvironmentContentFileDownloader } from './EnvironmentContentFileDownloader';

@Service()
export class EnvironmentFileDownloaderHandlerFactory
  implements DownloaderHandlerFactory
{
  constructor(
    private readonly environment: Environment,
    private readonly bucket: string
  ) {}

  downloader(): DownloaderHandler {
    return new EnvironmentContentFileDownloader(
      this.environment.download,
      this.bucket
    );
  }
}
