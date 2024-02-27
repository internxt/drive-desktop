import { RemoteFileSystem } from '../../../../../src/context/virtual-drive/folders/domain/file-systems/RemoteFileSystem';
import { FolderMover } from '../../../../../src/context/virtual-drive/folders/application/FolderMover';
import { FolderRepository } from '../../../../../src/context/virtual-drive/folders/domain/FolderRepository';
import { FolderPath } from '../../../../../src/context/virtual-drive/folders/domain/FolderPath';
import { Folder } from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { ParentFolderFinder } from '../../../../../src/context/virtual-drive/folders/application/ParentFolderFinder';

export class FolderMoverMock extends FolderMover {
  constructor() {
    super(
      {} as FolderRepository,
      {} as RemoteFileSystem,
      {} as ParentFolderFinder
    );
  }

  public readonly mock = jest.fn();

  run(folder: Folder, destination: FolderPath) {
    return this.mock(folder, destination);
  }
}
