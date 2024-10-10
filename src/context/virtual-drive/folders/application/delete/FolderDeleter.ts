import { Service } from 'diod';
import { Folder } from '../../domain/Folder';
import { RemoteFolderSystem } from '../../domain/file-systems/RemoteFolderSystem';

@Service()
export class FolderDeleter {
  constructor(private readonly fs: RemoteFolderSystem) {}

  async run(folder: Folder) {
    await this.fs.trash(folder.id);
  }
}
