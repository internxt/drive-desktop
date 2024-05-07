import { Readable } from 'stream';
import Chance from '../infrastructure/Chance';

export class ReadableMother {
  static any(): Readable {
    const content = Chance.paragraph();

    return Readable.from(content);
  }
}
