import { Service } from 'diod';
import { Folder, FolderAttributes } from '../domain/Folder';

@Service()
export class InMemoryFolderRepository {
  private folders: Map<Folder['id'], FolderAttributes>;

  constructor() {
    this.folders = new Map();
  }

  private get values(): Array<FolderAttributes> {
    return Array.from(this.folders.values());
  }

  searchByPartial(partial: Partial<FolderAttributes>): Folder | undefined {
    const keys = Object.keys(partial) as Array<keyof Partial<FolderAttributes>>;

    const folder = this.values.find((attributes) => {
      return keys.every((key) => attributes[key] === partial[key]);
    });

    if (folder) {
      return Folder.from(folder);
    }

    return undefined;
  }

  add(folder: Folder): void {
    this.folders.set(folder.id, folder.attributes());
  }

  delete(id: number): void {
    const deleted = this.folders.delete(id);

    if (!deleted) {
      throw new Error('Folder not found');
    }
  }

  update(folder: Folder): void {
    if (!this.folders.has(folder.id)) {
      throw new Error('Folder not found');
    }

    return this.add(folder);
  }
}
