import { Readable } from 'stream';
import { TemporalFile } from './TemporalFile';
import { TemporalFilePath } from './TemporalFilePath';
import { Optional } from '../../../../shared/types/Optional';

export abstract class TemporalFileRepository {
  abstract create(path: TemporalFilePath): Promise<void>;

  abstract delete(path: TemporalFilePath): Promise<void>;

  abstract matchingDirectory(path: string): Promise<Array<TemporalFilePath>>;

  abstract write(
    path: TemporalFilePath,
    buffer: Buffer,
    length: number,
    position: number
  ): Promise<void>;

  abstract read(path: TemporalFilePath): Promise<Buffer>;

  abstract stream(path: TemporalFilePath): Promise<Readable>;

  abstract find(
    documentPath: TemporalFilePath
  ): Promise<Optional<TemporalFile>>;

  abstract watchFile(
    documentPath: TemporalFilePath,
    callback: () => void
  ): () => void;

  abstract areEqual(
    doc1: TemporalFilePath,
    doc2: TemporalFilePath
  ): Promise<boolean>;
}
