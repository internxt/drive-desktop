import { ItemMetadata } from '../../shared/domain/ItemMetadata';

export interface FileMetadataCollection {
  add(path: string, metadata: ItemMetadata): void;
  remove(path: string): void;
  exists(path: string): boolean;
  get(path: string): ItemMetadata | undefined;
}
