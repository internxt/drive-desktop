import Chance from '../../infrastructure/__test-helpers__/Chance';

export class FolderNameMother {
  static any(): string {
    const length = Chance.integer({ min: 4, max: 15 });

    return Chance.word({ length });
  }
}
