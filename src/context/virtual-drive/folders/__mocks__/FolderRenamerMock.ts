import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { FolderRenamer } from '../application/FolderRenamer';
import { FolderRepository } from '../domain/FolderRepository';
import { SyncFolderMessenger } from '../domain/SyncFolderMessenger';
import { EventBus } from '../../shared/domain/EventBus';
import { Folder } from '../domain/Folder';
import { FolderPath } from '../domain/FolderPath';
import { FolderDescendantsPathUpdater } from '../application/FolderDescendantsPathUpdater';

export class FolderRenamerMock extends FolderRenamer {
  constructor() {
    super(
      {} as FolderRepository,
      {} as RemoteFileSystem,
      {} as EventBus,
      {} as SyncFolderMessenger,
      {} as FolderDescendantsPathUpdater,
    );
  }

  public readonly mock = vi.fn();

  run(folder: Folder, destination: FolderPath) {
    return this.mock(folder, destination);
  }
}
