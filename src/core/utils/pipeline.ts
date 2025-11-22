import { Data, Effect } from 'effect/index';
import { WriteStream } from 'node:fs';
import { pipeline as rawPipeline } from 'node:stream/promises';

export class PipelineAborted extends Data.TaggedError('PipelineAborted') {}
class PipelineError extends Data.TaggedError('PipelineError')<{ error: unknown }> {}

type Props = {
  readable: AsyncIterable<unknown>;
  writable: WriteStream;
};

export function pipeline({ readable, writable }: Props) {
  return Effect.tryPromise({
    try: () => rawPipeline(readable, writable),
    catch: (error) => {
      if (error instanceof Error && error.message === 'The operation was aborted') {
        return new PipelineAborted();
      }

      return new PipelineError({ error });
    },
  });
}
