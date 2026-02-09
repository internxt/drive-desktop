import fs from 'fs';
import { Readable, PassThrough } from 'stream';
import { writeReadableToFile } from './write-readable-to-file';
import { calls } from 'tests/vitest/utils.helper';

vi.mock('fs');

const mockedFS = vi.mocked(fs, true);

describe('writeReadableToFile', () => {
  it('writes the readable to the given path and reports progress', async () => {
    const onProgress = vi.fn();
    const writable = new PassThrough();
    mockedFS.createWriteStream.mockReturnValue(writable as unknown as fs.WriteStream);

    const readable = Readable.from([Buffer.from('he'), Buffer.from('llo')]);

    const promise = writeReadableToFile({
      readable,
      path: '/tmp/test-file.txt',
      onProgress,
    });

    await promise;

    expect(mockedFS.createWriteStream).toHaveBeenCalledWith('/tmp/test-file.txt');
    calls(onProgress).toHaveLength(2);
    calls(onProgress).toMatchObject([2, 5]);
  });

  it('rejects when the writable stream emits an error', async () => {
    const onProgress = vi.fn();
    const writable = new PassThrough();
    mockedFS.createWriteStream.mockReturnValue(writable as unknown as fs.WriteStream);

    const readable = new Readable({
      read() {},
    });

    const promise = writeReadableToFile({
      readable,
      path: '/tmp/fail.txt',
      onProgress,
    });

    const error = new Error('disk full');
    writable.destroy(error);

    await expect(promise).rejects.toThrow('disk full');
    calls(onProgress).toHaveLength(0);
  });
});
