import { Readable } from 'stream';
import { LocalFile } from '../LocalFile';

export abstract class LocalFileDownloaderFactory {
  abstract file(file: LocalFile): this;
  abstract build(): () => Promise<Readable>;
}
