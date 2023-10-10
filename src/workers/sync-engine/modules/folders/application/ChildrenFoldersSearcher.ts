import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';

export class ChildrenFoldersSearcher {
  constructor(private readonly repository: FolderRepository) {}

  private searchChildren(folder: Folder): Array<Folder> {
    const children = this.repository.matchingPartial({ parentId: folder.id });

    return children.flatMap((child) => this.searchChildren(child));
  }

  run(uuid: Folder['uuid']): Array<Folder> {
    const root = this.repository.searchByPartial({ uuid });

    if (!root) return [];

    return this.searchChildren(root);
  }
}
