import { Folder, FolderAttributes } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { Service } from 'diod';

@Service()
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

  async searchById(id: Folder['id']): Promise<Folder | undefined> {
    const attributes = this.folders.get(id);

    if (!attributes) return;

    return Folder.from(attributes);
  }

  async searchByUuid(id: Folder['uuid']): Promise<Folder | undefined> {
    const folders = this.folders.values();

    for (const attributes of folders) {
      if (id === attributes.uuid) {
        return Folder.from(attributes);
      }
    }

    return undefined;
  }

  matchingPartial(partial: Partial<FolderAttributes>): Array<Folder> {
    const keys = Object.keys(partial) as Array<keyof Partial<FolderAttributes>>;

    const foldersAttributes = this.values.filter((attributes) => {
      return keys.every(
        (key: keyof FolderAttributes) => attributes[key] === partial[key]
      );
    });

    return foldersAttributes.map((attributes) => Folder.from(attributes));
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

  async clear(): Promise<void> {
    this.folders.clear();
  }
}
