import Chance from 'chance';
import { FolderId } from '../FolderId';

const chance = new Chance();

export class FolderIdMother {
  static any(): FolderId {
    const value = chance.integer({ min: 1, max: Number.MAX_SAFE_INTEGER });

    return new FolderId(value);
  }
}
