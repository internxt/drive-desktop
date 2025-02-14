import { FileAttributes } from '../../../../../src/context/virtual-drive/files/domain/File';
import { FileStatuses } from '../../../../../src/context/virtual-drive/files/domain/FileStatus';
import { File } from '../../../../../src/context/virtual-drive/files/domain/File';
import { ContentsIdMother } from '../../contents/domain/ContentsIdMother.helper.test';
import { FilePathMother } from './FilePathMother.helper.test';
import { v4 } from 'uuid';

export class FileMother {
  static fromPath(path: string) {
    return File.from({
      id: 123456789,
      uuid: v4(),
      contentsId: ContentsIdMother.random().value,
      folderId: 3972960,
      createdAt: new Date().toISOString(),
      modificationTime: new Date().toISOString(),
      path: path,
      size: 893924973,
      updatedAt: new Date().toISOString(),
      status: FileStatuses.EXISTS,
    });
  }

  static any() {
    return File.from({
      id: 123456789,
      uuid: v4(),
      contentsId: ContentsIdMother.random().value,
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
      id: 123456789,
      uuid: v4(),
      contentsId: ContentsIdMother.random().value,
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
}
