import { FolderFinder } from '../../folders/application/FolderFinder';
import { File } from '../../files/domain/File';
import { Folder } from '../../folders/domain/Folder';
import { FileNotFoundError } from '../domain/errors/FileNotFoundError';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';

export class FileFolderContainerDetector {
  constructor(
    private readonly repository: InMemoryFileRepository,
    private readonly folderFinder: FolderFinder,
  ) {}

  run(uuid: File['uuid'], folderContentId: Folder['uuid']): boolean {
    const file = this.repository.searchByPartial({
      uuid,
    });
    if (!file) {
      throw new FileNotFoundError(uuid);
    }
    const folder = this.folderFinder.findFromId(file.folderId.value);
    return folder.uuid === folderContentId;
  }
}
