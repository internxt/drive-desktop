import { Readable } from 'stream';
import { LocalFileSystemCacheFileDownloader } from '../../../infrastructure/storage/LocalFileSystemCacheFileDownloader';
import { WebdavFileMother } from '../../domain/WebdavFileMother';
import { ContentFileDownloaderMock } from '../../__mocks__/ContentFileDownloaderMock';
import { LocalFileConentsRepositoryMock } from '../../__mocks__/LocalFileContentsRepositoryMock';

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

describe('Local File System Cache File Downloader', () => {
  it('returns a readable with the file contents cached', async () => {
    const file = WebdavFileMother.any();

    const downloader = new ContentFileDownloaderMock();
    const localFileContentsRepository = new LocalFileConentsRepositoryMock();
    const cachedDownloader = new LocalFileSystemCacheFileDownloader(
      downloader,
      localFileContentsRepository
    );

    localFileContentsRepository.existsMock.mockResolvedValueOnce(true);
    localFileContentsRepository.readMock.mockReturnValue(
      Readable.from(fileContents)
    );

    const contents = await cachedDownloader.download(file);

    const result = await readAll(contents);

    expect(result).toBe(fileContents);
  });

  it('does not download the file if its cached', async () => {
    const file = WebdavFileMother.any();

    const downloader = new ContentFileDownloaderMock();
    const localFileContentsRepository = new LocalFileConentsRepositoryMock();
    const cachedDownloader = new LocalFileSystemCacheFileDownloader(
      downloader,
      localFileContentsRepository
    );

    localFileContentsRepository.existsMock.mockResolvedValueOnce(true);
    localFileContentsRepository.readMock.mockReturnValue(
      Readable.from(fileContents)
    );

    await cachedDownloader.download(file);

    expect(downloader.mock).not.toBeCalled();
  });

  it('downloads the file if the file is not cached', async () => {
    const file = WebdavFileMother.any();

    const downloader = new ContentFileDownloaderMock();
    const localFileContentsRepository = new LocalFileConentsRepositoryMock();
    const cachedDownloader = new LocalFileSystemCacheFileDownloader(
      downloader,
      localFileContentsRepository
    );

    localFileContentsRepository.existsMock.mockResolvedValueOnce(false);
    localFileContentsRepository.writeMock.mockReturnValueOnce(
      Promise.resolve()
    );
    downloader.mock.mockResolvedValueOnce(Readable.from(fileContents));

    await cachedDownloader.download(file);

    expect(downloader.mock).toBeCalled();
    expect(localFileContentsRepository.readMock).not.toBeCalled();
  });

  it('stores the file if the file was not cached', async () => {
    const file = WebdavFileMother.any();

    const downloader = new ContentFileDownloaderMock();
    const localFileContentsRepository = new LocalFileConentsRepositoryMock();
    const cachedDownloader = new LocalFileSystemCacheFileDownloader(
      downloader,
      localFileContentsRepository
    );

    localFileContentsRepository.existsMock.mockResolvedValueOnce(false);
    localFileContentsRepository.writeMock.mockReturnValueOnce(
      Promise.resolve()
    );
    downloader.mock.mockResolvedValueOnce(Readable.from(fileContents));

    await cachedDownloader.download(file);

    expect(localFileContentsRepository.writeMock).toBeCalled();
  });

  it('does not fail if an error occurs during the caching of the file', async () => {
    const file = WebdavFileMother.any();

    const downloader = new ContentFileDownloaderMock();
    const localFileContentsRepository = new LocalFileConentsRepositoryMock();
    const cachedDownloader = new LocalFileSystemCacheFileDownloader(
      downloader,
      localFileContentsRepository
    );

    localFileContentsRepository.existsMock.mockResolvedValueOnce(false);
    localFileContentsRepository.writeMock.mockRejectedValueOnce(
      new Error('ERROR')
    );
    downloader.mock.mockResolvedValueOnce(Readable.from(fileContents));

    const result = await cachedDownloader.download(file).catch((err) => {
      expect(err).not.toBeDefined();
    });

    expect(result).toBeDefined();
    expect(localFileContentsRepository.writeMock).toBeCalled();
  });
});
