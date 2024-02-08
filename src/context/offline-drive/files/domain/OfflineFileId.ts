import { Uuid } from '../../../shared/domain/value-objects/Uuid';

export class OfflineFileId extends Uuid {
  static create(): OfflineFileId {
    return new OfflineFileId(this.random().value);
  }
}
