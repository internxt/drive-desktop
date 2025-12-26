import { WriteStream } from 'node:fs';
import { pipeline as rawPipeline } from 'node:stream/promises';

export class PipelineError extends Error {
  constructor(
    public readonly code: 'ABORTED' | 'UNKNOWN',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

type Props = {
  readable: AsyncIterable<unknown>;
  writable: WriteStream;
};

export async function pipeline({ readable, writable }: Props) {
  try {
    return await rawPipeline(readable, writable);
  } catch (error) {
    if (error instanceof Error && error.message === 'The operation was aborted') {
      return new PipelineError('ABORTED', error);
    }

    return new PipelineError('UNKNOWN', error);
  }
}
