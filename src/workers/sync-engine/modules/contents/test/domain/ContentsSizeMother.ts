import { ContentsSize } from '../../domain/ContentsSize';
import Chance from 'chance';
const chance = new Chance();

export class ContentsSizeMother {
  static random(): ContentsSize {
    return new ContentsSize(
      chance.integer({
        min: 1,
        max: ContentsSize.MAX_SIZE,
      })
    );
  }
}
