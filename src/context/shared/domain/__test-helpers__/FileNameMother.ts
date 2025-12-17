import Chance from '../../infrastructure/__test-helpers__/Chance';

export class FileNameMother {
  static any(): string {
    const length = Chance.integer({ min: 4, max: 15 });

    return `${Chance.word({ length })}.${Chance.word({ length: 3 })}`;
  }
}
