import { Readable } from 'stream';
import { TemporalFileSize } from '../TemporalFileSize';

export abstract class TemporalFileUploader {
  abstract uploader(
    readable: Readable,
    size: TemporalFileSize,
    desiredPathElements: {
      name: string;
      extension: string;
    },
    abortSignal?: AbortSignal
  ): () => Promise<string>;
}
