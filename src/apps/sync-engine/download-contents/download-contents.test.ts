import { mockDeep } from 'vitest-mock-extended';
import { Readable } from 'node:stream';
import { EnvironmentRemoteFileContentsManagersFactory } from '@/context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { InxtJs } from '@/infra';
import { DownloadContents } from './download-contents';

describe('download-contents', () => {
  const sendMock = partialSpyOn(ipcRendererSyncEngine, 'send');

  const factory = mockDeep<EnvironmentRemoteFileContentsManagersFactory>();
  const downloader = mockDeep<InxtJs.ContentsDownloader>();
  const SUT = new DownloadContents(factory);

  const chunks = [Buffer.from('first'), Buffer.from('second')];

  const props = mockProps<typeof SUT.run>({
    path: 'file.txt' as AbsolutePath,
    callback: vi.fn(),
    file: {
      size: 10,
    },
  });

  beforeEach(() => {
    factory.downloader.mockReturnValue(downloader);
  });

  it('should send chunks to C++ using callback', async () => {
    // Given
    downloader.download.mockResolvedValue({ data: Readable.from(chunks) });
    // When
    await SUT.run(props);
    // Then
    calls(sendMock).toStrictEqual([
      ['FILE_DOWNLOADING', { path: 'file.txt', progress: 0 }],
      ['FILE_DOWNLOADED', { path: 'file.txt' }],
    ]);

    calls(props.callback).toStrictEqual([
      [chunks[0], 0],
      [chunks[1], 5],
    ]);

    calls(props.ctx.logger.debug).toStrictEqual([
      { chunk: 6, msg: 'Last chunk received', offset: 5, path: 'file.txt', size: 10 },
      { msg: 'File downloaded', path: 'file.txt' },
    ]);
  });

  it('should send error if cannot obtain readable', async () => {
    // Given
    downloader.download.mockResolvedValue({ error: new Error('UNKNOWN') });
    // When
    await SUT.run(props);
    // Then
    call(props.ctx.logger.error).toMatchObject({ msg: 'Error downloading file', path: 'file.txt' });
    calls(downloader.forceStop).toHaveLength(1);
    calls(sendMock).toStrictEqual([
      ['FILE_DOWNLOADING', { path: 'file.txt', progress: 0 }],
      ['FILE_DOWNLOAD_ERROR', { path: 'file.txt' }],
    ]);
  });

  it('should ignore error if readable is aborted', async () => {
    // Given
    downloader.download.mockRejectedValue({ error: new Error('The operation was aborted') });
    // When
    await SUT.run(props);
    // Then
    call(sendMock).toStrictEqual(['FILE_DOWNLOADING', { path: 'file.txt', progress: 0 }]);
  });
});
