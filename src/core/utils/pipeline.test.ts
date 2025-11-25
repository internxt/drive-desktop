import { Readable } from 'node:stream';
import { pipeline, PipelineAborted, PipelineError } from './pipeline';
import { WriteStream } from 'node:fs';
import { Effect } from 'effect/index';
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
    await Effect.runPromise(pipeline({ readable, writable }));
    // Then
    calls(writable.write).toStrictEqual(chunks);
  });

  it('should return PipelineAborted if readable is aborted', async () => {
    // Given
    readable.destroy(new Error('The operation was aborted'));
    // When
    const result = await Effect.runPromiseExit(pipeline({ readable, writable }));
    // Then
    const error = result.toString();
    expect(error).toContain(PipelineAborted.name);
  });

  it('should return PipelineError in case of other error', async () => {
    // Given
    readable.destroy();
    // When
    const result = await Effect.runPromiseExit(pipeline({ readable, writable }));
    // Then
    const error = result.toString();
    expect(error).toContain(PipelineError.name);
    expect(error).toContain('ERR_STREAM_PREMATURE_CLOSE');
  });
});
