import { FileSizeMother } from '../FileSizeMother';
import { FilePathMother } from '../FilePathMother';
import { TemporalFileUploadedDomainEvent } from '../../../../../../src/context/offline-drive/TemporalFiles/domain/upload/TemporalFileUploadedDomainEvent';
import { BucketEntryIdMother } from '../../../shared/domain/BucketEntryIdMother';

export class OfflineContentsUploadedDomainEventMother {
  static replacesContents(): TemporalFileUploadedDomainEvent {
    return new TemporalFileUploadedDomainEvent({
      aggregateId: BucketEntryIdMother.primitive(),
      size: FileSizeMother.random().value,
      path: FilePathMother.random().value,
      replaces: BucketEntryIdMother.primitive(),
    });
  }

  static doesNotReplace(): TemporalFileUploadedDomainEvent {
    return new TemporalFileUploadedDomainEvent({
      aggregateId: BucketEntryIdMother.primitive(),
      size: FileSizeMother.random().value,
      path: FilePathMother.random().value,
      replaces: undefined,
    });
  }
}
