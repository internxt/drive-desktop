import { ContentsIdMother } from '../../../contents/test/domain/ContentsIdMother';
import { FolderUuid } from '../../../folders/domain/FolderUuid';
import { File, FileAttributes } from '../../domain/File';
import { FileStatuses } from '../../domain/FileStatus';
import { FilePathMother } from './FilePathMother';

export class FileMother {
  static onFolderName(path: string) {
    return File.from({
      contentsId: ContentsIdMother.random().value,
      folderId: 3972,
      createdAt: new Date().toISOString(),
      modificationTime: new Date().toISOString(),
      path: `/${path}/Dilbusege.png`,
      size: 8939,
      updatedAt: new Date().toISOString(),
      status: FileStatuses.EXISTS,
      folderUuid: FolderUuid.random().value,
    });
  }

  static fromPath(path: string) {
    return File.from({
      contentsId: ContentsIdMother.random().value,
      folderId: 3972960,
      createdAt: new Date().toISOString(),
      modificationTime: new Date().toISOString(),
      path: path,
      size: 893924973,
      updatedAt: new Date().toISOString(),
      status: FileStatuses.EXISTS,
      folderUuid: FolderUuid.random().value,
    });
  }

  static any() {
    return File.from({
      contentsId: ContentsIdMother.random().value,
      folderId: 3972960,
      createdAt: new Date().toISOString(),
      modificationTime: new Date().toISOString(),
      path: FilePathMother.random(2).value,
      size: 893924973,
      updatedAt: new Date().toISOString(),
      status: FileStatuses.EXISTS,
      folderUuid: FolderUuid.random().value,
    });
  }

  static fromPartial(partial: Partial<FileAttributes>) {
    return File.from({
      contentsId: ContentsIdMother.random().value,
      folderId: 3972960,
      createdAt: new Date().toISOString(),
      modificationTime: new Date().toISOString(),
      path: FilePathMother.random().value,
      size: 893924973,
      updatedAt: new Date().toISOString(),
      status: FileStatuses.EXISTS,
      folderUuid: FolderUuid.random().value,
      ...partial,
    });
  }
}
