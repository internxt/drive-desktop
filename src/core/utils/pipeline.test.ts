import { Readable } from 'node:stream';
import { pipeline } from './pipeline';
import { WriteStream } from 'node:fs';
import { calls } from '@/tests/vitest/utils.helper.test';

vi.mock(import('node:fs'));

describe('pipeline', () => {
  const chunks = ['hello', 'world'];
  let readable: Readable;
  let writable: WriteStream;

  beforeEach(() => {
    readable = Readable.from(chunks);
    writable = new WriteStream();
  });

  it('should write chunks from readable', async () => {
    // Given
    writable.write = vi.fn();
    // When
    const error = await pipeline({ readable, writable });
    // Then
    expect(error).toBeUndefined();
    calls(writable.write).toStrictEqual(chunks);
  });

  it('should return ABORTED if readable is aborted', async () => {
    // Given
    readable.destroy(new Error('The operation was aborted'));
    // When
    const error = await pipeline({ readable, writable });
    // Then
    expect(error?.code).toBe('ABORTED');
  });

  it('should return UNKNOWN in case of other error', async () => {
    // Given
    readable.destroy();
    // When
    const error = await pipeline({ readable, writable });
    // Then
    expect(error?.code).toContain('UNKNOWN');
  });
});
