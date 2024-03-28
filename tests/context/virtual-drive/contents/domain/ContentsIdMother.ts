import Chance from 'chance';
import { ContentsId } from '../../../../../src/context/virtual-drive/contents/domain/ContentsId';

const chance = new Chance();

export class ContentsIdMother {
  static random(): ContentsId {
    const raw = chance.string({ length: ContentsId.VALID_LENGTH });
    return new ContentsId(raw);
  }

  static primitive(): string {
    return chance.string({ length: ContentsId.VALID_LENGTH });
  }
}
