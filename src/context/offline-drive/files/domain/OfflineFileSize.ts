import { BucketEntry } from '../../../shared/domain/value-objects/BucketEntry';

export class OfflineFileSize extends BucketEntry {
  increment(bytes: number): OfflineFileSize {
    return new OfflineFileSize(this.value + bytes);
  }
}
