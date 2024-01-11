import { Uuid } from '../../../shared/domain/Uuid';

export class OfflineFileId extends Uuid {
  static create(): OfflineFileId {
    return new OfflineFileId(this.random().value);
  }
}
