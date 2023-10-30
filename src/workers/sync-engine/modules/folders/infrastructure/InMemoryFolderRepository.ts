import nodePath from 'path';
import { Nullable } from 'shared/types/Nullable';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { Folder, FolderAttributes } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';

export class InMemoryFolderRepository implements FolderRepository {
  public foldersAttributes: Record<string, FolderAttributes> = {};

  all(): Promise<Array<Folder>> {
    return Promise.resolve(
      Object.values(this.foldersAttributes).map((attributes) =>
        Folder.from(attributes)
      )
    );
  }

  searchByPartial(
    partial: Partial<FolderAttributes>
  ): Promise<Nullable<Folder>> {
    const keys = Object.keys(partial) as Array<keyof Partial<FolderAttributes>>;

    const folder = Object.values(this.foldersAttributes).find((folder) => {
      return keys.every((key) => folder[key] === partial[key]);
    });

    if (folder) {
      return Promise.resolve(Folder.from(folder));
    }

    return Promise.resolve(undefined);
  }

  async add(folder: Folder): Promise<void> {
    const normalized = nodePath.normalize(folder.path.value);
    const posix = PlatformPathConverter.winToPosix(normalized);
    this.foldersAttributes[posix] = folder.attributes();
  }

  async update(folder: Folder): Promise<void> {
    this.foldersAttributes[folder.path.value] = folder.attributes();
  }

  async delete(folder: Folder): Promise<void> {
    const normalized = nodePath.normalize(folder.path.value);
    const posix = PlatformPathConverter.winToPosix(normalized);

    delete this.foldersAttributes[posix];
  }
}
