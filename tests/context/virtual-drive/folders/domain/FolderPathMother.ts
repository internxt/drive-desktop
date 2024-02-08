import path from 'path';
import { FolderPath } from '../../../../../src/context/virtual-drive/folders/domain/FolderPath';
import Chance from 'chance';

const chance = new Chance();

export class FolderPathMother {
  static any(): FolderPath {
    const levels = chance.integer({ min: 2, max: 10 });

    const names = [''];

    for (let i = 1; i < levels; i++) {
      names.push(chance.word({ length: chance.integer({ min: 1, max: 20 }) }));
    }

    return new FolderPath(path.normalize(names.join('/')));
  }

  static onFolder(folder: FolderPath): FolderPath {
    const name = chance.word({ length: chance.integer({ min: 1, max: 20 }) });

    return new FolderPath(path.normalize([folder.value, name].join('/')));
  }

  static withDifferentParent(folderPath: FolderPath, name: string): FolderPath {
    const asArray = folderPath.value.split('/');

    asArray[asArray.length - 2] = name;

    return new FolderPath(asArray.join('/'));
  }
}
