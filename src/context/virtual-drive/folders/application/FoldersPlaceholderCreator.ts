import { Folder } from '../domain/Folder';
import { NodeWinLocalFolderSystem } from '../infrastructure/NodeWinLocalFolderSystem';

export class FoldersPlaceholderCreator {
  constructor(private readonly local: NodeWinLocalFolderSystem) {}

  async run(folders: Array<Folder>) {
    const createPromises = folders.map((folder) => this.local.createPlaceHolder(folder));
    await Promise.all(createPromises);
  }
}
