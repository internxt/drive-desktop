import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { loggerFn } from '@/tests/vitest/mocks.helper.test';
import { calls, deepMocked, partialSpyOn, TestProps } from '@/tests/vitest/utils.helper.test';
import { downloadRelease } from './download-release';
import * as showDialogModule from './show-dialog';
import * as verifyHashModule from './verify-hash';

vi.mock(import('node:fs'));
vi.mock(import('node:stream/promises'));

describe('download-release', () => {
  deepMocked(pipeline);
  const createWriteStreamMock = deepMocked(createWriteStream);
  const verifyHashMock = partialSpyOn(verifyHashModule, 'verifyHash');
  const showDialogMock = partialSpyOn(showDialogModule, 'showDialog');

  const props: TestProps<typeof downloadRelease> = {
    fileName: 'Internxt-Setup-10.0.0.exe',
    latest: '10.0.0',
  };

  beforeEach(() => {
    createWriteStreamMock.mockReturnValue({});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body: new ReadableStream() }));
  });

  it('should download, verify and show dialog', async () => {
    // When
    await downloadRelease(props as any);
    // Then
    calls(verifyHashMock).toHaveLength(1);
    calls(showDialogMock).toHaveLength(1);
    calls(loggerFn).toMatchObject([{ msg: 'Downloading release' }, { msg: 'New release downloaded' }]);
  });

  it('should log error if HTTP request fails', async () => {
    // Given
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    // When
    await downloadRelease(props as any);
    // Then
    calls(verifyHashMock).toHaveLength(0);
    calls(showDialogMock).toHaveLength(0);
    calls(loggerFn).toMatchObject([{ msg: 'Downloading release' }, { msg: 'Cannot download release' }]);
  });
});
