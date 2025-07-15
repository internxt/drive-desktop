import { Service } from 'diod';
import { File, FileAttributes } from '../domain/File';

@Service()
export class InMemoryFileRepository {
  private files: Map<string, FileAttributes>;

  private get values(): Array<FileAttributes> {
    return Array.from(this.files.values());
  }

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

  searchByPartial(partial: Partial<FileAttributes>): File | undefined {
    const keys = Object.keys(partial) as Array<keyof Partial<FileAttributes>>;

    const file: FileAttributes | undefined = this.values.find((attributes) => {
      return keys.every((key: keyof FileAttributes) => {
        if (key === 'contentsId') {
          return attributes[key].normalize() == (partial[key] as string).normalize();
        }
        return attributes[key] == partial[key];
      });
    });

    if (file) {
      return File.from(file);
    }

    return undefined;
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

  update(file: File): void {
    if (!this.files.has(file.contentsId)) {
      throw new Error('File not found');
    }

    return this.add(file);
  }
}
