import { Readable } from 'stream';
import { CachedContentFileDownloader } from '../../../infrastructure/download/CachedContentFileDownloader';
import { FileMother } from '../../../../files/test/domain/FileMother';
import { ContentFileDownloaderMock } from '../../__mocks__/ContentFileDownloaderMock';
import { ContentsCacheRepositoryMock } from '../../__mocks__/ContentsCacheRepositoryMock';

const fileContents = `
Commodo cillum nulla sit est nulla quis incididunt laboris in ex.
Proident quis amet quis laborum anim cillum ea quis mollit id.
Elit duis excepteur irure ex veniam aute pariatur aute exercitation dolor irure voluptate.
Amet incididunt aliquip laboris consequat officia occaecat est est eiusmod.

Voluptate nostrud duis labore aute laborum occaecat pariatur minim cupidatat aliqua tempor.
Labore pariatur aliqua elit cupidatat enim dolore.
Irure laborum et deserunt et nulla et ipsum nostrud.
Aliquip amet fugiat velit excepteur duis excepteur cupidatat amet voluptate mollit.
Cillum exercitation sint ex magna consequat dolore.
`;

function readAll(readable: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    let fileContent = '';

    readable.on('data', (chunk) => {
      fileContent += chunk;
    });

    readable.on('end', () => {
      resolve(fileContent);
    });

    readable.on('error', (err) => {
      reject(err);
    });
  });
}

describe('cached content file downloader', () => {
  const contents = Readable.from(fileContents);

  let downloader: ContentFileDownloaderMock;
  let cacheRepository: ContentsCacheRepositoryMock;
  let cachedDownloader: CachedContentFileDownloader;

  beforeEach(() => {
    downloader = new ContentFileDownloaderMock();
    cacheRepository = new ContentsCacheRepositoryMock();
    cachedDownloader = new CachedContentFileDownloader(
      downloader,
      cacheRepository
    );
  });

  it('returns a readable with the cached file contents', async () => {
    const file = FileMother.any();

    cacheRepository.existsMock.mockResolvedValueOnce(true);
    cacheRepository.readMock.mockReturnValue(contents);

    const readable = await cachedDownloader.download(file);

    const result = await readAll(readable);

    expect(result).toBe(fileContents);
  });

  it('does not download the file if its cached', async () => {
    const file = FileMother.any();

    cacheRepository.existsMock.mockResolvedValueOnce(true);
    cacheRepository.readMock.mockResolvedValue(contents);

    await cachedDownloader.download(file);

    expect(downloader.mock).not.toBeCalled();
  });

  it('downloads the file if the file is not cached', async () => {
    const file = FileMother.any();

    cacheRepository.writeMock.mockReturnValueOnce(Promise.resolve());
    downloader.mock.mockResolvedValueOnce(contents);

    await cachedDownloader.download(file);

    expect(downloader.mock).toBeCalled();
    expect(cacheRepository.readMock).not.toBeCalled();
  });

  it('caches the file if the file was not cached', async () => {
    const file = FileMother.any();

    cacheRepository.writeMock.mockReturnValueOnce(Promise.resolve());
    downloader.mock.mockResolvedValueOnce(contents);

    await cachedDownloader.download(file);

    expect(cacheRepository.writeMock).toBeCalled();
  });

  it('does not fail if an error occurs during the caching of the file', async () => {
    const file = FileMother.any();

    cacheRepository.writeMock.mockRejectedValueOnce(new Error('ERROR'));
    downloader.mock.mockResolvedValueOnce(contents);

    const result = await cachedDownloader.download(file).catch((err) => {
      expect(err).not.toBeDefined();
    });

    expect(result).toBeDefined();
    expect(cacheRepository.writeMock).toBeCalled();
  });
});
