import { ItemMetadata } from '../../../shared/domain/ItemMetadata';
import { FileMetadataCollection } from '../../domain/FileMetadataCollection';

export class InMemoryTemporalFileMetadataCollection
  implements FileMetadataCollection
{
  private collection: Record<string, ItemMetadata> = {};

  add(path: string, metadata: ItemMetadata): void {
    if (!this.collection[path]) {
      this.collection[path] = metadata;
    }
  }

  remove(path: string): void {
    delete this.collection[path];
  }

  exists(path: string): boolean {
    return (
      this.collection[path] !== undefined && this.collection[path] !== null
    );
  }

  get(path: string): ItemMetadata | undefined {
    return this.collection[path];
  }
}
