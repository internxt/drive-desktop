import { Folder, FolderAttributes } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';

export class InMemoryFolderRepository implements FolderRepository {
  private folders: Map<Folder['id'], FolderAttributes>;

  constructor() {
    this.folders = new Map();
  }

  private get values(): Array<FolderAttributes> {
    return Array.from(this.folders.values());
  }

  all(): Promise<Folder[]> {
    const folders = [...this.folders.values()].map((attributes) =>
      Folder.from(attributes)
    );

    return Promise.resolve(folders);
  }

  searchByPartial(partial: Partial<FolderAttributes>): Folder | undefined {
    const keys = Object.keys(partial) as Array<keyof Partial<FolderAttributes>>;

    const folder = this.values.find((attributes) => {
      return keys.every(
        (key: keyof FolderAttributes) => attributes[key] === partial[key]
      );
    });

    if (folder) {
      return Folder.from(folder);
    }

    return undefined;
  }

  listByPartial(partial: Partial<FolderAttributes>): Promise<Folder[]> {
    const keys = Object.keys(partial) as Array<keyof Partial<FolderAttributes>>;

    const folderAttributes = this.values.filter((attributes) => {
      return keys.every(
        (key: keyof FolderAttributes) => attributes[key] === partial[key]
      );
    });

    const folders = folderAttributes.map((attributes) =>
      Folder.from(attributes)
    );

    return Promise.resolve(folders);
  }

  async add(folder: Folder): Promise<void> {
    this.folders.set(folder.id, folder.attributes());
  }

  async delete(id: number): Promise<void> {
    const deleted = this.folders.delete(id);

    if (!deleted) {
      throw new Error('Folder not found');
    }
  }

  async update(folder: Folder): Promise<void> {
    if (!this.folders.has(folder.id)) {
      throw new Error('Folder not found');
    }

    return this.add(folder);
  }
}
