import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';

export class FolderContainerDetector {
  constructor(private readonly repository: FolderRepository) {}

  run(fodlerContentId: Folder['uuid'], parentFolderContentId: Folder['uuid']): boolean {
    const folder = this.repository.searchByPartial({ uuid: fodlerContentId });

    if (!folder) {
      throw new Error('Folder not found');
    }

    const parent = this.repository.searchByPartial({
      id: folder.parentId as number,
    });

    if (!parent) {
      throw new Error('Parent folder not found');
    }

    return parent.uuid === parentFolderContentId;
  }
}
