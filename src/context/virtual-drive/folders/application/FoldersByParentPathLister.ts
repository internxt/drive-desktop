import { Folder } from '../domain/Folder';
import { FolderPath } from '../domain/FolderPath';
import { FolderRepository } from '../domain/FolderRepository';
import { ParentFolderFinder } from './ParentFolderFinder';

export class FoldersByParentPathLister {
  constructor(
    private readonly parentFolderFinder: ParentFolderFinder,
    private readonly repository: FolderRepository
  ) {}

  async run(folderPath: FolderPath): Promise<Array<Folder['name']>> {
    const parent = await this.parentFolderFinder.run(folderPath);

    const folders = this.repository.matchingPartial({
      parentId: parent.id,
    });

    return folders.map((folder) => folder.name);
  }
}
