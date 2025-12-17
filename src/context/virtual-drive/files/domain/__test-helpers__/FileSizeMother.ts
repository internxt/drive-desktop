import Chance from 'chance';
import { FileSize } from '../FileSize';
const chance = new Chance();

export class FileSizeMother {
  static random() {
    return new FileSize(chance.integer({ min: 0, max: FileSize.MAX_SIZE }));
  }

  static primitive(): number {
    return FileSizeMother.random().value;
  }
}
