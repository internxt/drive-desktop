import { RemoteFileSystem } from '../../../../../src/context/virtual-drive/folders/domain/file-systems/RemoteFileSystem';
import { FolderRenamer } from '../../../../../src/context/virtual-drive/folders/application/FolderRenamer';
import { FolderRepository } from '../../../../../src/context/virtual-drive/folders/domain/FolderRepository';
import { SyncFolderMessenger } from '../../../../../src/context/virtual-drive/folders/domain/SyncFolderMessenger';
import { EventBus } from '../../../../../src/context/virtual-drive/shared/domain/EventBus';
import { Folder } from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { FolderPath } from '../../../../../src/context/virtual-drive/folders/domain/FolderPath';

export class FolderRenamerMock extends FolderRenamer {
  constructor() {
    super(
      {} as FolderRepository,
      {} as RemoteFileSystem,
      {} as EventBus,
      {} as SyncFolderMessenger
    );
  }

  public readonly mock = jest.fn();

  run(folder: Folder, destination: FolderPath) {
    return this.mock(folder, destination);
  }
}
