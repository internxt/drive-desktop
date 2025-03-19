import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';

export class FolderContainerDetector {
  constructor(private readonly repository: FolderRepository) {}

  run(folderContentId: Folder['uuid'], parentFolderContentId: Folder['uuid']): boolean {
    const folder = this.repository.searchByPartial({ uuid: folderContentId });

    if (!folder) {
      throw new Error('Folder not found');
    }

    const parent = this.repository.searchByPartial({
      uuid: folder.parentUuid as string,
    });

    if (!parent) {
      throw new Error('Parent folder not found');
    }

    return parent.uuid === parentFolderContentId;
  }
}
