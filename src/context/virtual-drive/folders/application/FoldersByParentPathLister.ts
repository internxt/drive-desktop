import { Service } from 'diod';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { SingleFolderMatchingFinder } from './SingleFolderMatchingFinder';

@Service()
export class FoldersByParentPathLister {
  constructor(
    private readonly singleFolderMatchingFinder: SingleFolderMatchingFinder,
    private readonly repository: FolderRepository
  ) {}

  async run(path: string): Promise<Array<Folder['name']>> {
    const folder = await this.singleFolderMatchingFinder.run({ path });

    const folders = this.repository.matchingPartial({
      parentId: folder.id,
    });

    return folders.map((folder) => folder.name);
  }
}
