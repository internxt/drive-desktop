import Chance from '../infrastructure/Chance';

export class FileNameMother {
  static any(): string {
    const length = Chance.integer({ min: 4, max: 15 });

    return `${Chance.word({ length })}.${Chance.word({ length: 3 })}`;
  }
}
