import { FileMetadataCollection } from '../../domain/FileMetadataCollection';

export class TemporalFileMetadataDeleter {
  constructor(private readonly collection: FileMetadataCollection) {}

  run(path: string): void {
    this.collection.remove(path);
  }
}
