import fs from 'node:fs/promises';
import { fileExistsOnDisk } from './file-exists-on-disk';

vi.mock('node:fs/promises', () => ({
  default: {
    stat: vi.fn(),
  },
}));

const fsMock = vi.mocked(fs);

describe('fileExistsOnDisk', () => {
  it('returns true when fs.stat succeeds', async () => {
    fsMock.stat.mockResolvedValue({} as Awaited<ReturnType<typeof fs.stat>>);

    await expect(fileExistsOnDisk('/tmp/cache-file')).resolves.toBe(true);

    expect(fsMock.stat).toHaveBeenCalledWith('/tmp/cache-file');
  });

  it('returns false when fs.stat rejects', async () => {
    fsMock.stat.mockRejectedValue(new Error('missing'));

    await expect(fileExistsOnDisk('/tmp/cache-file')).resolves.toBe(false);
  });
});
