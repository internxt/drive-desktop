import { FileMetadataCollection } from 'workers/webdav/modules/files/domain/FileMetadataCollection';
import { ItemMetadata } from '../../../shared/domain/ItemMetadata';

export class InMemoryItemsMock implements FileMetadataCollection {
  public mockSearch = jest.fn();
  public mockAdd = jest.fn();
  public mockUpdate = jest.fn();
  public mockRemove = jest.fn();
  public mockExists = jest.fn();
  public mockExistsByLastPath = jest.fn();
  public mockGet = jest.fn();
  public mockGetByLastPath = jest.fn();
  public mockGetAll = jest.fn(() => ({}));
  public mockGetAllByType = jest.fn((_: string) => ({}));

  add(path: string, metadata: ItemMetadata): void {
    return this.mockSearch(path, metadata);
  }
  update(path: string, metadata: Partial<ItemMetadata>): ItemMetadata | null {
    return this.mockUpdate(path, metadata);
  }
  remove(path: string): void {
    return this.mockRemove(path);
  }
  exists(pathToCheck: string): boolean {
    return this.mockExists(pathToCheck);
  }
  existsByLastPath(pathToCheck: string): boolean {
    return this.mockExistsByLastPath(pathToCheck);
  }
  getByLastPath(pathToCheck: string): ItemMetadata | undefined {
    return this.mockGetByLastPath(pathToCheck);
  }
  get(pathToCheck: string): ItemMetadata | undefined {
    return this.mockGet(pathToCheck);
  }
  getAll(): Record<string, ItemMetadata> {
    return this.mockGetAll();
  }
  getAllByType(type: 'FILE' | 'FOLDER'): Record<string, ItemMetadata> {
    return this.mockGetAllByType(type);
  }
}
