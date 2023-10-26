import { File } from '../../files/domain/File';
import { Folder } from '../../folders/domain/Folder';
import { PlaceholderCreator } from '../domain/PlaceholderCreator';
import { createFolderPlaceholderId } from '../domain/FolderPlaceholderId';
import { createFilePlaceholderId } from '../domain/FilePlaceholderId';
import { FolderStatuses } from '../../folders/domain/FolderStatus';
import { FileStatuses } from '../../files/domain/FileStatus';

export class VirtualDrivePlaceholderCreator implements PlaceholderCreator {
  constructor(private readonly drive: VirtualDrive) {}

  folder(folder: Folder): void {
    if (!folder.hasStatus(FolderStatuses.EXISTS)) {
      return;
    }

    const folderPath = `${folder.path.value}/`;

    const placeholderId = createFolderPlaceholderId(folder.uuid);

    this.drive.createFolderByPath(
      folderPath,
      placeholderId,
      0,
      folder.createdAt.getTime(),
      folder.updatedAt.getTime()
    );
  }

  file(file: File): void {
    if (!file.hasStatus(FileStatuses.EXISTS)) {
      return;
    }

    const placeholderId = createFilePlaceholderId(file.contentsId);

    this.drive.createFileByPath(
      file.path.value,
      placeholderId,
      file.size,
      file.createdAt.getTime(),
      file.updatedAt.getTime()
    );
  }
}
