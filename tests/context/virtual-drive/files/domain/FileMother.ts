import { FileAttributes } from '../../../../../src/context/virtual-drive/files/domain/File';
import { FileStatuses } from '../../../../../src/context/virtual-drive/files/domain/FileStatus';
import { File } from '../../../../../src/context/virtual-drive/files/domain/File';
import { FilePathMother } from './FilePathMother';
import Chance from 'chance';
import { UuidMother } from '../../../shared/domain/UuidMother';
import { BucketEntryIdMother } from '../../shared/domain/BucketEntryIdMother';

const chance = new Chance();

export class FileMother {
  private static readonly MAX_ARRAY_GENERATION = 10;

  static any() {
    return File.from({
      id: chance.integer({ min: 1000 }),
      uuid: UuidMother.primitive(),
      contentsId: BucketEntryIdMother.primitive(),
      folderId: 3972960,
      createdAt: new Date().toISOString(),
      modificationTime: new Date().toISOString(),
      path: FilePathMother.random(2).value,
      size: 893924973,
      updatedAt: new Date().toISOString(),
      status: FileStatuses.EXISTS,
    });
  }

  static fromPartial(partial: Partial<FileAttributes>) {
    return File.from({
      id: chance.integer({ min: 1000 }),
      uuid: UuidMother.primitive(),
      contentsId: BucketEntryIdMother.primitive(),
      folderId: 3972960,
      createdAt: new Date().toISOString(),
      modificationTime: new Date().toISOString(),
      path: FilePathMother.random().value,
      size: 893924973,
      updatedAt: new Date().toISOString(),
      status: FileStatuses.EXISTS,
      ...partial,
    });
  }

  static array(partial?: Partial<FileAttributes>): Array<File> {
    return new Array(
      chance.integer({ min: 1, max: FileMother.MAX_ARRAY_GENERATION })
    )
      .fill(0)
      .map(() => FileMother.fromPartial(partial ?? {}));
  }
}
