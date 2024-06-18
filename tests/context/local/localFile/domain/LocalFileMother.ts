import {
  LocalFile,
  LocalFileAttributes,
} from '../../../../../src/context/local/localFile/domain/LocalFile';
import { DateMother } from '../../../shared/domain/DateMother';
import { AbsolutePathMother } from '../../../shared/infrastructure/AbsolutePathMother';
import Chance from '../../../shared/infrastructure/Chance';

export class LocalFileMother {
  static any(): LocalFile {
    return LocalFile.from({
      path: AbsolutePathMother.anyFile(),
      modificationTime: DateMother.today().getTime(),
      size: Chance.integer({ min: 1, max: 10_000 }),
    });
  }

  static fromPartial(partial: Partial<LocalFileAttributes>): LocalFile {
    return LocalFile.from({
      ...LocalFileMother.any().attributes(),
      ...partial,
    });
  }

  static array(
    numberOfElements: number,
    generator?: (position: number) => Partial<LocalFileAttributes>
  ): Array<LocalFile> {
    const array = [];

    for (let i = 0; i < numberOfElements; i++) {
      array.push(LocalFileMother.fromPartial(generator ? generator(i) : {}));
    }

    return array;
  }
}
