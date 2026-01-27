import { mockDeep } from 'vitest-mock-extended';
import { Readable } from 'node:stream';
import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { InxtJs } from '@/infra';
import { downloadContents } from './download-contents';
import { LocalSync } from '@/backend/features';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('download-contents', () => {
  const addItemMock = partialSpyOn(LocalSync.SyncState, 'addItem');

  const contentsDownloader = mockDeep<InxtJs.ContentsDownloader>();

  const callback = vi.fn();
  const chunks = [Buffer.from('first'), Buffer.from('second')];

  const props = mockProps<typeof downloadContents>({
    ctx: { contentsDownloader },
    path: 'file.txt' as AbsolutePath,
    file: { size: 10 },
    callback,
  });

  beforeEach(() => {
    contentsDownloader.download.mockResolvedValue({ data: Readable.from(chunks) });
  });

  it('should send chunks to C++ using callback', async () => {
    // Given
    callback.mockReturnValue(undefined);
    // When
    await downloadContents(props);
    // Then
    calls(addItemMock).toStrictEqual([
      { action: 'DOWNLOADING', path: 'file.txt', progress: 0 },
      { action: 'DOWNLOADED', path: 'file.txt' },
    ]);

    calls(callback).toStrictEqual([
      [chunks[0], 0],
      [chunks[1], 5],
    ]);

    calls(loggerMock.debug).toStrictEqual([
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
    calls(contentsDownloader.forceStop).toHaveLength(1);
    calls(addItemMock).toStrictEqual([
      { action: 'DOWNLOADING', path: 'file.txt', progress: 0 },
      { action: 'DOWNLOAD_ERROR', path: 'file.txt' },
    ]);
  });

  it('should ignore error if operation is cancelled by user', async () => {
    // Given
    callback.mockImplementation(() => {
      throw new Error('0x8007018e');
    });
    // When
    await downloadContents(props);
    // Then
    calls(contentsDownloader.forceStop).toHaveLength(1);
    calls(addItemMock).toStrictEqual([
      { action: 'DOWNLOADING', path: 'file.txt', progress: 0 },
      { action: 'DOWNLOAD_CANCEL', path: 'file.txt' },
    ]);
  });
});
