import { FileSizeMother } from '../../__test-helpers__/FileSizeMother';
import { TemporalFileUploadedDomainEvent } from '../../../../../storage/TemporalFiles/domain/upload/TemporalFileUploadedDomainEvent';
import { BucketEntryIdMother } from 'src/context/virtual-drive/shared/domain/__test-helpers__/BucketEntryIdMother';
import { FilePathMother } from '../../__test-helpers__/FilePathMother';

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
