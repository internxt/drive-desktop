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

  async searchByContentsIds(contentsIds: File['contentsId'][]): Promise<Array<File>> {
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
  async delete(id: File['contentsId']): Promise<void> {
    const deleted = this.files.delete(id);

    if (!deleted) {
      throw new Error('File not found');
    }
  }

  async add(file: File): Promise<void> {
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

  async update(file: File): Promise<void> {
    if (!this.files.has(file.contentsId)) {
      throw new Error('File not found');
    }

    return this.add(file);
  }

  async updateContentsAndSize(file: File, newContentsId: File['contentsId'], newSize: File['size']): Promise<File> {
    if (!this.files.has(file.contentsId)) {
      throw new Error('File not found');
    }
    const oldContentsId = file.contentsId;
    const updatedFile = file.replaceContestsAndSize(newContentsId, newSize);
    // first delete the old file to be able to add the new one
    this.files.delete(oldContentsId);
    this.add(updatedFile);
    return updatedFile;
  }
}
