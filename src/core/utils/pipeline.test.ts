import { WriteStream } from 'node:fs';
import { Readable, Writable } from 'node:stream';
import { pipeline } from './pipeline';

describe('pipeline', () => {
  const chunks = ['hello', 'world'];
  let readable: Readable;
  let writtenChunks: string[];
  let writable: WriteStream;

  beforeEach(() => {
    readable = Readable.from(chunks);
    writtenChunks = [];
    writable = new Writable({
      write(chunk, _encoding, callback) {
        writtenChunks.push(chunk.toString());
        callback();
      },
    }) as WriteStream;
  });

  it('should write chunks from readable', async () => {
    // When
    const error = await pipeline({ readable, writable });
    // Then
    expect(error).toBeUndefined();
    expect(writtenChunks).toStrictEqual(chunks);
  });

  it('should return ABORTED if readable is aborted', async () => {
    // Given
    readable = new Readable({
      read() {
        this.destroy(new Error('The operation was aborted'));
      },
    });
    // When
    const error = await pipeline({ readable, writable });
    // Then
    expect(error?.code).toBe('ABORTED');
  });

  it('should return UNKNOWN in case of other error', async () => {
    // Given
    readable = new Readable({
      read() {
        this.destroy(new Error('Unexpected failure'));
      },
    });
    // When
    const error = await pipeline({ readable, writable });
    // Then
    expect(error?.code).toContain('UNKNOWN');
  });
});
