import { Readable } from 'stream';
import { readStreamToBuffer } from './read-stream-to-buffer';
import { calls } from 'tests/vitest/utils.helper';

describe('readStreamToBuffer', () => {
  it('returns the full buffer and reports progress', async () => {
    const onProgress = vi.fn();
    const stream = Readable.from([Buffer.from('he'), Buffer.from('llo')]);

    const result = await readStreamToBuffer({ stream, onProgress });

    expect(result).toEqual(Buffer.from('hello'));
    calls(onProgress).toHaveLength(2);
    calls(onProgress).toMatchObject([2, 5]);
  });

  it('returns an empty buffer and does not call onProgress when stream is empty', async () => {
    const onProgress = vi.fn();
    const stream = Readable.from([]);

    const result = await readStreamToBuffer({ stream, onProgress });

    expect(result).toEqual(Buffer.alloc(0));
    calls(onProgress).toHaveLength(0);
  });

  it('handles a single chunk correctly', async () => {
    const onProgress = vi.fn();
    const stream = Readable.from([Buffer.from('world')]);

    const result = await readStreamToBuffer({ stream, onProgress });

    expect(result).toEqual(Buffer.from('world'));
    calls(onProgress).toHaveLength(1);
    calls(onProgress).toMatchObject([5]);
  });

  it('rejects when the stream emits an error', async () => {
    const onProgress = vi.fn();
    const stream = new Readable({
      read() {
        this.destroy(new Error('stream failure'));
      },
    });

    await expect(readStreamToBuffer({ stream, onProgress })).rejects.toThrow('stream failure');
  });
});
