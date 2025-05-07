import { FolderPath } from '../domain/FolderPath';
import { Folder } from '../domain/Folder';
import { HttpRemoteFolderSystem } from '../infrastructure/HttpRemoteFolderSystem';
import { InMemoryFolderRepository } from '../infrastructure/InMemoryFolderRepository';

export class FolderRenamer {
  constructor(
    private readonly repository: InMemoryFolderRepository,
    private readonly remote: HttpRemoteFolderSystem,
  ) {}

  async run(folder: Folder, destination: FolderPath) {
    folder.rename(destination);

    await this.remote.rename(folder);
    this.repository.update(folder);
  }
}
