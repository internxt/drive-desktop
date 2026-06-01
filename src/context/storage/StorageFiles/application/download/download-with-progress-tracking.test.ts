import { Readable } from 'stream';
import { downloadWithProgressTracking } from './download-with-progress-tracking';
import { DownloadProgressTrackerMock } from '../../__mocks__/DownloadProgressTrackerMock';
import { FileMother } from '../../../../virtual-drive/files/domain/__test-helpers__/FileMother';
import { StorageFilesRepositoryMock } from '../../__mocks__/StorageFilesRepositoryMock';
import { StorageFile } from '../../domain/StorageFile';
import { StorageFileDownloader } from './StorageFileDownloader/StorageFileDownloader';
import { call, calls, partialSpyOn } from 'tests/vitest/utils.helper';

describe('downloadWithProgressTracking', () => {
  const elapsedTime = 123;

  let tracker: DownloadProgressTrackerMock;
  let downloader: { run: ReturnType<typeof vi.fn> };
  let repository: StorageFilesRepositoryMock;

  beforeEach(() => {
    tracker = new DownloadProgressTrackerMock();
    downloader = {
      run: vi.fn(),
    };
    repository = new StorageFilesRepositoryMock();
  });

  it('tracks progress, stores the file, and returns the storage file', async () => {
    const storeMock = partialSpyOn(repository, 'store');

    const virtualFile = FileMother.fromPartial({
      size: 100,
      path: 'folder/test-file.txt',
    });

    const handler = { elapsedTime: vi.fn(() => elapsedTime) };
    const stream = Readable.from('hello');
    const metadata = { name: virtualFile.name, type: virtualFile.type, size: virtualFile.size };

    downloader.run.mockResolvedValue({ stream, metadata, handler });
    storeMock.mockImplementation(async (_file, _readable, onProgress) => {
      [20, 200].forEach((bytes) => onProgress(bytes));
    });

    const result = await downloadWithProgressTracking({
      virtualFile,
      tracker,
      downloader: downloader as unknown as StorageFileDownloader,
      repository,
    });

    call(tracker.downloadStarted).toMatchObject([virtualFile.name, virtualFile.type]);
    calls(tracker.downloadUpdate).toHaveLength(2);
    calls(tracker.downloadUpdate).toMatchObject([
      [metadata.name, metadata.type, { percentage: 0.2, elapsedTime }],
      [metadata.name, metadata.type, { percentage: 1, elapsedTime }],
    ]);
    call(tracker.downloadFinished).toMatchObject([metadata.name, metadata.type]);

    call(downloader.run).toMatchObject([expect.any(StorageFile), virtualFile]);
    call(storeMock).toMatchObject([expect.any(StorageFile), stream, expect.any(Function)]);

    expect(result.attributes()).toStrictEqual({
      id: virtualFile.contentsId,
      virtualId: virtualFile.uuid,
      size: virtualFile.size,
    });
  });
});
