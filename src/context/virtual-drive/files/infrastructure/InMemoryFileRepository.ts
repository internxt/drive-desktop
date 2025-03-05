import { Service } from 'diod';
import { File, FileAttributes } from '../domain/File';
import Logger from 'electron-log';
@Service()
export class InMemoryFileRepository {
  private files: Map<string, FileAttributes>;

  private filesByUuid: Map<File['uuid'], FileAttributes>;
  private filesByContentsId: Map<File['contentsId'], FileAttributes>;

  private get values(): Array<FileAttributes> {
    return Array.from(this.files.values());
  }

  constructor() {
    this.files = new Map();
    this.filesByUuid = new Map();
    this.filesByContentsId = new Map();
  }

  public all(): Promise<Array<File>> {
    const files = [...this.files.values()].map((attributes) =>
      File.from(attributes)
    );
    return Promise.resolve(files);
  }

  async searchByContentsIds(contentsIds: File['contentsId'][]): Promise<Array<File>> {
    Logger.debug('FilesByContentsIds', Object(this.files).keys, Object(this.files).values);
    const files = contentsIds.map((contentsId) => {
      const file = this.files.get(contentsId);
      if (file) {
        return File.from(file);
      }
      return undefined;
    }).filter((file) => file !== undefined);
    
    return files;
  }
  
  async allSearchByPartial(
    partial: Partial<FileAttributes>
  ): Promise<Array<File>> {
    const keys = Object.keys(partial) as Array<keyof Partial<FileAttributes>>;

    const files = this.values
      .filter((attributes) => {
        return keys.every((key: keyof FileAttributes) => {
          if (key === 'contentsId') {
            return (
              attributes[key].normalize() ==
              (partial[key] as string).normalize()
            );
          }

          return attributes[key] == partial[key];
        });
      })
      .map((attributes) => File.from(attributes));

    return files;
  }

  searchByPartial(partial: Partial<FileAttributes>): File | undefined {
    const keys = Object.keys(partial) as Array<keyof Partial<FileAttributes>>;

    const file: FileAttributes | undefined = this.values.find((attributes) => {
      return keys.every((key: keyof FileAttributes) => {
        if (key === 'contentsId') {
          return (
            attributes[key].normalize() == (partial[key] as string).normalize()
          );
        }
        return attributes[key] == partial[key];
      });
    });

    if (file) {
      return File.from(file);
    }

    return undefined;
  }
  matchingPartial(partial: Partial<FileAttributes>): Array<File> {
    const keys = Object.keys(partial) as Array<keyof Partial<FileAttributes>>;

    const filesAttributes = this.values.filter((attributes) => {
      return keys.every((key: keyof FileAttributes) => {
        if (key === 'contentsId') {
          return (
            attributes[key].normalize() == (partial[key] as string).normalize()
          );
        }

        return attributes[key] == partial[key];
      });
    });

    if (!filesAttributes) {
      return [];
    }

    return filesAttributes.map((attributes) => File.from(attributes));
  }

  async upsert(file: File): Promise<boolean> {
    const attributes = file.attributes();

    const isAlreadyStored =
      this.filesByUuid.has(file.uuid) ||
      this.filesByContentsId.has(file.contentsId);

    if (isAlreadyStored) {
      this.filesByUuid.delete(file.uuid);
      this.filesByContentsId.delete(file.contentsId);
    }

    this.filesByUuid.set(file.uuid, attributes);
    this.filesByContentsId.set(file.contentsId, attributes);

    return isAlreadyStored;
  }
  async delete(id: File['contentsId']): Promise<void> {
    const deleted = this.files.delete(id);

    if (!deleted) {
      throw new Error('File not found');
    }
  }

  async add(file: File): Promise<void> {
    Logger.debug('Add method, inMemoryFileRepository');
    this.files.set(file.contentsId, {
      id: file.id,
      uuid: file.uuid,
      contentsId: file.contentsId,
      folderId: file.folderId.value,
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

  async updateContentsAndSize(
    file: File,
    newContentsId: File['contentsId'],
    newSize: File['size']
  ): Promise<File> {
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
