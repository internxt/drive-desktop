import { Folder } from '../domain/Folder';
import { NodeWinLocalFileSystem } from '../infrastructure/NodeWinLocalFileSystem';

export class FoldersPlaceholderCreator {
  constructor(private readonly local: NodeWinLocalFileSystem) {}

  async run(folders: Array<Folder>) {
    const createPromises = folders.map((folder) => this.local.createPlaceHolder(folder));
    await Promise.all(createPromises);
  }
}
