import { TemporalFilePath } from './TemporalFilePath';

export abstract class TemporalFileCache {
  abstract has(path: TemporalFilePath): boolean;
  abstract set(path: TemporalFilePath, value: Buffer): void;
  abstract read(path: TemporalFilePath, from: number, to: number): Buffer;
  abstract delete(path: TemporalFilePath): void;
  abstract clear(): void;
}
