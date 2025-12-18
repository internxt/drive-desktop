import { mockDeep } from 'vitest-mock-extended';
import { Readable } from 'node:stream';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { InxtJs } from '@/infra';
import { downloadContents } from './download-contents';
import { LocalSync } from '@/backend/features';

describe('download-contents', () => {
  const addItemMock = partialSpyOn(LocalSync.SyncState, 'addItem');

  const contentsDownloader = mockDeep<InxtJs.ContentsDownloader>();

  const chunks = [Buffer.from('first'), Buffer.from('second')];

  const props = mockProps<typeof downloadContents>({
    ctx: { contentsDownloader },
    path: 'file.txt' as AbsolutePath,
    callback: vi.fn(),
    file: { size: 10 },
  });

  it('should send chunks to C++ using callback', async () => {
    // Given
    contentsDownloader.download.mockResolvedValue({ data: Readable.from(chunks) });
    // When
    await downloadContents(props);
    // Then
    calls(addItemMock).toStrictEqual([
      { action: 'DOWNLOADING', path: 'file.txt', progress: 0 },
      { action: 'DOWNLOADED', path: 'file.txt' },
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
    contentsDownloader.download.mockResolvedValue({ error: new Error('UNKNOWN') });
    // When
    await downloadContents(props);
    // Then
    call(props.ctx.logger.error).toMatchObject({ msg: 'Error downloading file', path: 'file.txt' });
    calls(contentsDownloader.forceStop).toHaveLength(1);
    calls(addItemMock).toStrictEqual([
      { action: 'DOWNLOADING', path: 'file.txt', progress: 0 },
      { action: 'DOWNLOAD_ERROR', path: 'file.txt' },
    ]);
  });

  it('should ignore error if readable is aborted', async () => {
    // Given
    contentsDownloader.download.mockRejectedValue({ error: new Error('The operation was aborted') });
    // When
    await downloadContents(props);
    // Then
    call(addItemMock).toStrictEqual({ action: 'DOWNLOADING', path: 'file.txt', progress: 0 });
  });
});
