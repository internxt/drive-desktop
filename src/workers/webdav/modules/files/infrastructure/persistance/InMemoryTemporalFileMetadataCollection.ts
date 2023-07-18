import { ItemMetadata } from '../../../shared/domain/ItemMetadata';
import { FileMetadataCollection } from '../../domain/FileMetadataCollection';

export class InMemoryTemporalFileMetadataCollection
  implements FileMetadataCollection
{
  private collection: Record<string, ItemMetadata> = {};

  add(path: string, metadata: ItemMetadata): void {
    this.collection[path] = metadata;
  }

  update(path: string, metadata: Partial<ItemMetadata>): ItemMetadata | null {
    if (!this.collection[path]) return null;

    const actualItem = this.collection[path];

    this.collection[path] = ItemMetadata.from({
      createdAt:
        metadata.createdAt === undefined
          ? actualItem.createdAt
          : metadata.createdAt,
      updatedAt:
        metadata.updatedAt === undefined
          ? actualItem.updatedAt
          : metadata.updatedAt,
      name: metadata.name === undefined ? actualItem.name : metadata.name,
      size: metadata.size === undefined ? actualItem.size : metadata.size,
      extension:
        metadata.extension === undefined
          ? actualItem.extension
          : metadata.extension,
      type: metadata.type === undefined ? actualItem.type : metadata.type,
      visible:
        metadata.visible === undefined ? actualItem.visible : metadata.visible,
      externalMetadata:
        (metadata.externalMetadata === undefined
          ? actualItem.externalMetadata
          : metadata.externalMetadata) ?? {},
    });

    return this.collection[path];
  }

  remove(path: string): void {
    delete this.collection[path];
  }

  exists(pathToCheck: string): boolean {
    let exists = false;
    Object.keys(this.collection).forEach((path) => {
      if (exists) return;
      const item = this.collection[path];

      if (pathToCheck === path) {
        exists = true;
      }

      if (item.lastPath && item.lastPath === pathToCheck) {
        exists = true;
      }
    });
    return exists;
  }

  get(path: string): ItemMetadata | undefined {
    return this.collection[path];
  }

  getAll() {
    return this.collection;
  }

  getAllByType(type: ItemMetadata['type']) {
    const all: Record<string, ItemMetadata> = {};

    Object.keys(this.collection).forEach((path) => {
      const item = this.collection[path];

      if (item.type === type) {
        all[path] = item;
      }
    });

    return all;
  }
}
