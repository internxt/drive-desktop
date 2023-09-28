import { File } from 'workers/sync-engine/modules/files/domain/File';
import { PlaceholderCreator } from '../../domain/PlaceholderCreator';
import { Folder } from 'workers/sync-engine/modules/folders/domain/Folder';

export class PlaceholderCreatorMock implements PlaceholderCreator {
  fileMock = jest.fn();
  folderMock = jest.fn();

  file(file: File) {
    this.fileMock(file);
  }

  folder(folder: Folder) {
    this.folderMock(folder);
  }
}
