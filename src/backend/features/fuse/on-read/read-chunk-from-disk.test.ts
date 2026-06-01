import fs from 'fs/promises';
import { readChunkFromDisk } from './read-chunk-from-disk';
import { call } from '../../../../../tests/vitest/utils.helper';
import { mockDeep } from 'vitest-mock-extended';

vi.mock(import('fs/promises'));

const fsMock = mockDeep(fs);

describe('readChunkFromDisk', () => {
  const closeMock = vi.fn();
  const readMock = vi.fn();

  beforeEach(() => {
    fsMock.open.mockResolvedValue({ read: readMock, close: closeMock } as unknown as fs.FileHandle);
  });

  it('should open the file in read mode', async () => {
    readMock.mockResolvedValue({ bytesRead: 0 });

    await readChunkFromDisk('/path/to/file', 10, 0);

    call(fsMock.open).toStrictEqual(['/path/to/file', 'r']);
  });

  it('should read the requested length at the given position', async () => {
    readMock.mockResolvedValue({ bytesRead: 10 });

    await readChunkFromDisk('/path/to/file', 10, 50);

    call(readMock).toMatchObject([expect.any(Uint8Array), 0, 10, 50]);
  });

  it('should return a buffer trimmed to bytesRead', async () => {
    readMock.mockResolvedValue({ bytesRead: 3 });

    const chunk = await readChunkFromDisk('/path/to/file', 10, 0);

    expect(chunk).toHaveLength(3);
  });

  it('should return an empty buffer when bytesRead is 0', async () => {
    readMock.mockResolvedValue({ bytesRead: 0 });

    const chunk = await readChunkFromDisk('/path/to/file', 10, 0);

    expect(chunk).toHaveLength(0);
  });

  it('should close the file handle after reading', async () => {
    readMock.mockResolvedValue({ bytesRead: 5 });

    await readChunkFromDisk('/path/to/file', 5, 0);

    expect(closeMock).toHaveBeenCalledOnce();
  });

  it('should close the file handle even if read throws', async () => {
    readMock.mockRejectedValue(new Error('read failed'));

    await expect(readChunkFromDisk('/path/to/file', 5, 0)).rejects.toThrow('read failed');

    expect(closeMock).toHaveBeenCalledOnce();
  });
});
