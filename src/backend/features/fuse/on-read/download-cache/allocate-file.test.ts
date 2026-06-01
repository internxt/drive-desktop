import fs from 'node:fs/promises';
import { allocateFile } from './allocate-file';

vi.mock('node:fs/promises', () => ({
  default: {
    open: vi.fn(),
  },
}));

const fsMock = vi.mocked(fs);

function createHandle() {
  return {
    truncate: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

describe('allocateFile', () => {
  it('opens the file for writing and truncates it to the requested size', async () => {
    const handle = createHandle();
    fsMock.open.mockResolvedValue(handle as unknown as Awaited<ReturnType<typeof fs.open>>);

    await allocateFile('/tmp/cache-file', 1024);

    expect(fsMock.open).toHaveBeenCalledWith('/tmp/cache-file', 'w');
    expect(handle.truncate).toHaveBeenCalledWith(1024);
  });

  it('closes the file handle after successful allocation', async () => {
    const handle = createHandle();
    fsMock.open.mockResolvedValue(handle as unknown as Awaited<ReturnType<typeof fs.open>>);

    await allocateFile('/tmp/cache-file', 1024);

    expect(handle.close).toHaveBeenCalledOnce();
  });

  it('closes the file handle when truncate fails', async () => {
    const handle = createHandle();
    handle.truncate.mockRejectedValue(new Error('truncate failed'));
    fsMock.open.mockResolvedValue(handle as unknown as Awaited<ReturnType<typeof fs.open>>);

    await expect(allocateFile('/tmp/cache-file', 1024)).rejects.toThrow('truncate failed');

    expect(handle.close).toHaveBeenCalledOnce();
  });

  it('propagates open failures', async () => {
    fsMock.open.mockRejectedValue(new Error('open failed'));

    await expect(allocateFile('/tmp/cache-file', 1024)).rejects.toThrow('open failed');
  });
});
