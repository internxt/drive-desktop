import { ItemMetadata } from '../../shared/domain/ItemMetadata';

export interface FileMetadataCollection {
  add(path: string, metadata: ItemMetadata): void;
  remove(path: string): void;
  exists(path: string): boolean;
  existsByLastPath(path: string): boolean;
  getByLastPath(path: string): ItemMetadata | undefined;
  update(path: string, metadata: Partial<ItemMetadata>): ItemMetadata | null;
}
