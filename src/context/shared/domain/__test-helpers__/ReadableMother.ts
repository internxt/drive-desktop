import { Readable } from 'stream';
import Chance from '../../infrastructure/__test-helpers__/Chance';

export class ReadableMother {
  static any(): Readable {
    const content = Chance.paragraph();

    return Readable.from(content);
  }
}
