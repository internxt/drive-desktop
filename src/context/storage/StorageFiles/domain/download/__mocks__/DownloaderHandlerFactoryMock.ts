import { DownloaderHandler } from '../DownloaderHandler';
import { DownloaderHandlerFactory } from '../DownloaderHandlerFactory';

export class DownloaderHandlerFactoryMock implements DownloaderHandlerFactory {
  downloader = vi.fn<() => DownloaderHandler>(
    () =>
      ({
        download: vi.fn(),
        downloadById: vi.fn(),
        forceStop: vi.fn(),
        on: vi.fn(),
        elapsedTime: vi.fn().mockReturnValue(0),
      }) as unknown as DownloaderHandler,
  );
}
