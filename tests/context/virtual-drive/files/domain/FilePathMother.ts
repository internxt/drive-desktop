import Chance from 'chance';
import path from 'path';
import { FilePath } from '../../../../../src/context/virtual-drive/files/domain/FilePath';
const chance = new Chance();

export class FilePathMother {
  static random(level = 0): FilePath {
    if (level < 0) {
      throw new Error('Nested level of a file must be greater or equal to 0');
    }

    const name = `/${chance.word()}.${chance.word({ length: 3 })}`;

    if (level === 0) {
      return new FilePath(path.posix.join(name));
    }

    const folders = chance.sentence({ words: level });

    return new FilePath(path.posix.join(...folders, name));
  }

  static thumbnable(level = 0): FilePath {
    if (level < 0) {
      throw new Error('Nested level of a file must be greater or equal to 0');
    }

    const name = `/${chance.word()}.png`;

    if (level === 0) {
      return new FilePath(path.posix.join(name));
    }

    const folders = chance.sentence({ words: level });

    return new FilePath(path.posix.join(...folders, name));
  }

  static withExtension(extension: string, level = 0): FilePath {
    if (level < 0) {
      throw new Error('Nested level of a file must be greater or equal to 0');
    }

    const name = `/${chance.word()}.${extension}`;

    if (level === 0) {
      return new FilePath(path.posix.join(name));
    }

    const folders = chance.sentence({ words: level });

    return new FilePath(path.posix.join(...folders, name));
  }
}
