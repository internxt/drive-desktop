import { Folder, FolderAttributes } from './Folder';

export abstract class FolderRepository {
  abstract all(): Promise<Array<Folder>>;

  abstract searchById(id: Folder['id']): Promise<Folder | undefined>;

  abstract searchByUuid(id: Folder['uuid']): Promise<Folder | undefined>;

  abstract matchingPartial(partial: Partial<FolderAttributes>): Array<Folder>;

  abstract add(folder: Folder): Promise<void>;

  abstract delete(id: Folder['id']): Promise<void>;

  abstract update(folder: Folder): Promise<void>;
}
