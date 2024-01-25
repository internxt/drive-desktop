import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderFinder } from './FolderFinder';

export class FoldersByParentPathLister {
  constructor(
    private readonly folderFinder: FolderFinder,
    private readonly repository: FolderRepository
  ) {}

  async run(path: string): Promise<Array<Folder['name']>> {
    const parent = this.folderFinder.run(path);

    const folders = await this.repository.listByPartial({
      parentId: parent?.id,
    });

    return folders.map((folder) => folder.name);
  }
}
