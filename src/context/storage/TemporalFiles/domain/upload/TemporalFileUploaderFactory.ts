import { Readable } from 'stream';
import { TemporalFile } from '../TemporalFile';
import { Replaces } from './Replaces';

export abstract class TemporalFileUploaderFactory {
  abstract read(readable: Readable): this;
  abstract document(document: TemporalFile): this;
  abstract replaces(r?: Replaces): this;
  abstract abort(controller?: AbortController): this;
  abstract build(): () => Promise<string>;
}
