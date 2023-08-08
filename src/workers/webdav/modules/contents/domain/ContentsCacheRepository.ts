import { Readable } from 'stream';

export interface ContentsCacheRepository {
  exists(fileId: string): boolean;

  read(fileId: string): Readable;

  write(fileId: string, content: Readable, size: number): Promise<void>;

  delete(fileId: string): Promise<void>;

  usage(): Promise<number>;
}
