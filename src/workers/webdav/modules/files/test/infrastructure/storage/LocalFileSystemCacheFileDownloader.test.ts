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
    const file = WebdavFileMother.fromPartial({
      size: 10,
    });

    const downloader = new ContentFileDownloaderMock();
    const localFileContentsRepository = new LocalFileConentsRepositoryMock();
    const cachedDownloader = new LocalFileSystemCacheFileDownloader(
      downloader,
      localFileContentsRepository,
      100
    );

    localFileContentsRepository.readMock.mockReturnValue(
      Readable.from(fileContents)
    );
    localFileContentsRepository.usageMock.mockResolvedValue(0);
    localFileContentsRepository.writeMock.mockReturnValue(Promise.resolve());

    await cachedDownloader.download(file);

    const contents = await cachedDownloader.download(file);

    const result = await readAll(contents);

    expect(result).toBe(fileContents);
  });

  it('does not download the file if its cached', async () => {
    const file = WebdavFileMother.fromPartial({
      size: 10,
    });

    const downloader = new ContentFileDownloaderMock();
    const localFileContentsRepository = new LocalFileConentsRepositoryMock();
    const cachedDownloader = new LocalFileSystemCacheFileDownloader(
      downloader,
      localFileContentsRepository,
      100
    );

    localFileContentsRepository.usageMock.mockResolvedValue(10);
    downloader.mock.mockResolvedValueOnce(Readable.from(fileContents));
    localFileContentsRepository.readMock.mockResolvedValue(
      Readable.from(fileContents)
    );
    localFileContentsRepository.writeMock.mockReturnValue(Promise.resolve());

    expect(await localFileContentsRepository.usage()).toBe(10);

    await cachedDownloader.download(file);

    downloader.mock.mockReset();

    await cachedDownloader.download(file);

    expect(downloader.mock).not.toBeCalled();
  });

  it('downloads the file if the file is not cached', async () => {
    const file = WebdavFileMother.any();

    const downloader = new ContentFileDownloaderMock();
    const localFileContentsRepository = new LocalFileConentsRepositoryMock();
    const cachedDownloader = new LocalFileSystemCacheFileDownloader(
      downloader,
      localFileContentsRepository,
      100
    );

    localFileContentsRepository.writeMock.mockReturnValueOnce(
      Promise.resolve()
    );
    downloader.mock.mockResolvedValueOnce(Readable.from(fileContents));

    await cachedDownloader.download(file);

    expect(downloader.mock).toBeCalled();
    expect(localFileContentsRepository.readMock).not.toBeCalled();
  });

  it('stores the file if the file was not cached', async () => {
    const file = WebdavFileMother.fromPartial({
      size: 500,
    });

    const downloader = new ContentFileDownloaderMock();
    const localFileContentsRepository = new LocalFileConentsRepositoryMock();
    const cachedDownloader = new LocalFileSystemCacheFileDownloader(
      downloader,
      localFileContentsRepository,
      1024
    );

    localFileContentsRepository.writeMock.mockReturnValueOnce(
      Promise.resolve()
    );
    downloader.mock.mockResolvedValueOnce(Readable.from(fileContents));

    await cachedDownloader.download(file);

    expect(localFileContentsRepository.writeMock).toBeCalled();
  });

  it('does not fail if an error occurs during the caching of the file', async () => {
    const file = WebdavFileMother.fromPartial({
      size: 500,
    });

    const downloader = new ContentFileDownloaderMock();
    const localFileContentsRepository = new LocalFileConentsRepositoryMock();
    const cachedDownloader = new LocalFileSystemCacheFileDownloader(
      downloader,
      localFileContentsRepository,
      1024
    );

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

  describe('storage usage', () => {
    it('deletes the least recent accessed file when the maximum storage usage has been reached', async () => {
      const localFileContentsRepository = new LocalFileConentsRepositoryMock();
      const cachedDownloader = new LocalFileSystemCacheFileDownloader(
        new ContentFileDownloaderMock(),
        localFileContentsRepository,
        30
      );

      localFileContentsRepository.usageMock
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(20);
      localFileContentsRepository.writeMock.mockReturnValue(Promise.resolve());

      await cachedDownloader
        .download(
          WebdavFileMother.fromPartial({
            fileId: '190f5ea6-252d-5a79-8e04-6eb58623ed3f',
            size: 20,
          })
        )
        .catch((err) => {
          expect(err).not.toBeDefined();
        });
      await cachedDownloader
        .download(
          WebdavFileMother.fromPartial({
            fileId: 'c86327a6-6cdc-581e-97e3-67267cd088c3',
            size: 20,
          })
        )
        .catch((err) => {
          expect(err).not.toBeDefined();
        });

      expect(localFileContentsRepository.deleteMock).toHaveBeenCalled();
    });

    it('does not store the file if it is larger than the size of the cache', async () => {
      const cacheSize = 50;
      const containerDownloader = new ContentFileDownloaderMock();
      const localFileContentsRepository = new LocalFileConentsRepositoryMock();
      const cachedDownloader = new LocalFileSystemCacheFileDownloader(
        containerDownloader,
        localFileContentsRepository,
        cacheSize
      );

      containerDownloader.mock.mockResolvedValue(Readable.from(''));

      localFileContentsRepository.usageMock.mockResolvedValue(cacheSize);

      await cachedDownloader
        .download(
          WebdavFileMother.fromPartial({
            fileId: '190f5ea6-252d-5a79-8e04-6eb58623ed3f',
            size: cacheSize + 1,
          })
        )
        .catch((err) => {
          expect(err).not.toBeDefined();
        });

      expect(localFileContentsRepository.writeMock).not.toBeCalled();
    });
  });
});
