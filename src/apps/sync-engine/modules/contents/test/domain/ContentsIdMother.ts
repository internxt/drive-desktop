import { ContentsId } from '../../domain/ContentsId';
import Chance from 'chance';
const chance = new Chance();

export class ContentsIdMother {
  static random(): ContentsId {
    const raw = chance.string({ length: ContentsId.VALID_LENGTH });
    return new ContentsId(raw);
  }

  static raw(): string {
    return chance.string({ length: ContentsId.VALID_LENGTH });
  }
}
