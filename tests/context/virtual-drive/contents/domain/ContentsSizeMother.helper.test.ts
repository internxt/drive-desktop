import Chance from 'chance';
import { ContentsSize } from '../../../../../src/context/virtual-drive/contents/domain/ContentsSize';
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
