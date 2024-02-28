import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { SingleFolderMatchingFinder } from './SingleFolderMatchingFinder';

export class FoldersByParentPathLister {
  constructor(
    private readonly SingleFolderMatchingFinder: SingleFolderMatchingFinder,
    private readonly repository: FolderRepository
  ) {}

  async run(path: string): Promise<Array<Folder['name']>> {
    const folder = await this.SingleFolderMatchingFinder.run({ path });

    const folders = this.repository.matchingPartial({
      parentId: folder.id,
    });

    return folders.map((folder) => folder.name);
  }
}
