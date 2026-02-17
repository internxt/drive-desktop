import { FolderMover } from '../application/FolderMover';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderPath } from '../domain/FolderPath';
import { Folder } from '../domain/Folder';
import { ParentFolderFinder } from '../application/ParentFolderFinder';
import { FolderDescendantsPathUpdater } from '../application/FolderDescendantsPathUpdater';

export class FolderMoverMock extends FolderMover {
  constructor() {
    super({} as FolderRepository, {} as ParentFolderFinder, {} as FolderDescendantsPathUpdater);
  }

  public readonly mock = vi.fn();

  run(folder: Folder, destination: FolderPath) {
    return this.mock(folder, destination);
  }
}
