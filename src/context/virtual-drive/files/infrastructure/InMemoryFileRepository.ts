import { Service } from 'diod';
import { File, FileAttributes } from '../domain/File';

@Service()
export class InMemoryFileRepository {
  private files: Map<string, FileAttributes>;

  constructor() {
    this.files = new Map();
  }

  searchByContentsIds(contentsIds: File['contentsId'][]): Array<File> {
    const files = contentsIds
      .map((contentsId) => {
        const file = this.files.get(contentsId);
        if (file) {
          return File.from(file);
        }
        return undefined;
      })
      .filter((file) => file !== undefined);

    return files as Array<File>;
  }

  add(file: File): void {
    this.files.set(file.contentsId, {
      id: file.id,
      uuid: file.uuid,
      contentsId: file.contentsId,
      folderId: file.folderId.value,
      folderUuid: file.folderUuid?.value,
      path: file.path,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toDateString(),
      size: file.size,
      status: file.status.value,
      modificationTime: file.updatedAt.toISOString(),
    });
  }
}
