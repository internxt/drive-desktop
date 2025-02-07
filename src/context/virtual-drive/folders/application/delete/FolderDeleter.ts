import { Service } from 'diod';
import { Folder } from '../../domain/Folder';
import { HttpRemoteFolderSystem } from '../../infrastructure/HttpRemoteFolderSystem';

@Service()
export class FolderDeleter {
  constructor(private readonly fs: HttpRemoteFolderSystem) {}

  async run(folder: Folder) {
    await this.fs.trash(folder.id);
  }
}
