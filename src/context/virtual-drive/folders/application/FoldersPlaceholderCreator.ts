import { Folder } from '../domain/Folder';
import { LocalFolderSystem } from '../domain/file-systems/LocalFolderSystem';

export class FoldersPlaceholderCreator {
  constructor(private readonly local: LocalFolderSystem) {}

  async run(folders: Array<Folder>): Promise<void> {
    const createPromises = folders.map((folder) =>
      this.local.createPlaceHolder(folder)
    );

    await Promise.all(createPromises);
  }
}
