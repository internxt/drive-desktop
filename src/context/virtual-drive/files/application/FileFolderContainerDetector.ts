import { FolderFinder } from '../../folders/application/FolderFinder';
import { File } from '../../files/domain/File';
import { Folder } from '../../folders/domain/Folder';
import { FileRepository } from '../domain/FileRepository';

export class FileFolderContainerDetector {
  constructor(
    private readonly repository: FileRepository,
    private readonly folderFinder: FolderFinder
  ) {}

  run(contentId: File['contentsId'], folderContentId: Folder['uuid']): boolean {
    const file = this.repository.searchByPartial({ contentsId: contentId });
    const folder = this.folderFinder.findFromId(file?.folderId);
    const [_, folderUuid] = folder.placeholderId.split(':');
    return folderUuid === folderContentId;
  }
}
