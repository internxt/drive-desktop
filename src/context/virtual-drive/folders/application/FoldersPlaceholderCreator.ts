import { Service } from 'diod';
import { Folder } from '../domain/Folder';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';

@Service()
export class FoldersPlaceholderCreator {
  constructor(private readonly local: LocalFileSystem) {}

  async run(folders: Array<Folder>): Promise<void> {
    const createPromises = folders.map((folder) =>
      this.local.createPlaceHolder(folder)
    );

    await Promise.all(createPromises);
  }
}
