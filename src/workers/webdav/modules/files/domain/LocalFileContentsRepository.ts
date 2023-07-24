import { Readable } from 'stream';

export interface LocalFileConentsRepository {
  exists(fileId: string): Promise<boolean>;

  read(fileId: string): Readable;

  write(fileId: string, content: Readable): Promise<void>;

  delete(fileId: string): Promise<void>;

  usage(): Promise<number>;
}
