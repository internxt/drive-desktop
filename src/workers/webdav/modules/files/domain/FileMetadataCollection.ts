import { ItemMetadata } from '../../shared/domain/ItemMetadata';

export interface FileMetadataCollection {
  add(path: string, metadata: ItemMetadata): void;
  remove(path: string): void;
  exists(path: string): boolean;
  existsByLastPath(path: string): boolean;
  get(path: string): ItemMetadata | undefined;
  getByLastPath(path: string): ItemMetadata | undefined;
  getAllByType(type: ItemMetadata['type']): Record<string, ItemMetadata>;
  update(path: string, metadata: Partial<ItemMetadata>): ItemMetadata | null;
}
