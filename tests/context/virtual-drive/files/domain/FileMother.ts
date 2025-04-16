import { FileAttributes } from '../../../../../src/context/virtual-drive/files/domain/File';
import { FileStatuses } from '../../../../../src/context/virtual-drive/files/domain/FileStatus';
import { File } from '../../../../../src/context/virtual-drive/files/domain/File';
import { ContentsIdMother } from '../../contents/domain/ContentsIdMother';
import { FilePathMother } from './FilePathMother';
import { v4 } from 'uuid';

export const generateRandomFileId = () => {
  return Math.floor(Math.random() * 1000000);
};

export class FileMother {
  static fromPath(path: string) {
    return File.from({
      uuid: v4(),
      contentsId: ContentsIdMother.random().value,
      folderId: 3972960,
      folderUuid: v4(),
      createdAt: new Date().toISOString(),
      modificationTime: new Date().toISOString(),
      path,
      size: 893924973,
      updatedAt: new Date().toISOString(),
      status: FileStatuses.EXISTS,
      id: generateRandomFileId(),
    });
  }

  static any() {
    return File.from({
      uuid: v4(),
      id: generateRandomFileId(),
      contentsId: ContentsIdMother.random().value,
      folderId: 3972960,
      folderUuid: v4(),
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
      id: generateRandomFileId(),
      uuid: v4(),
      contentsId: ContentsIdMother.random().value,
      folderId: 3972960,
      folderUuid: v4(),
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
