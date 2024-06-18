import path from 'path';
import Chance from './Chance';
import { AbsolutePath } from '../../../../src/context/local/localFile/infrastructure/AbsolutePath';

export class AbsolutePathMother {
  static anyFolder(): AbsolutePath {
    const level = Chance.integer({ min: 0, max: 100 });
    const name = Chance.word();

    if (level === 0) {
      return path.posix.join(name) as AbsolutePath;
    }

    const folders = Chance.sentence({ words: level });

    return `/${path.posix.join(...folders, name)}` as AbsolutePath;
  }

  static anyFile(): AbsolutePath {
    const folder = AbsolutePathMother.anyFolder();

    const name = `/${Chance.word()}.${Chance.word({ length: 3 })}`;

    return path.join(folder, name) as AbsolutePath;
  }
}
