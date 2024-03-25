import { OfflineContentsUploadedDomainEvent } from '../../../../../../src/context/offline-drive/contents/domain/events/OfflineContentsUploadedDomainEvent';
import { FileSizeMother } from '../FileSizeMother';
import { FilePathMother } from '../FilePathMother';
import { ContentsIdMother } from '../../../contents/domain/ContentsIdMother';

export class OfflineContentsUploadedDomainEventMother {
  static replacesContents(): OfflineContentsUploadedDomainEvent {
    return new OfflineContentsUploadedDomainEvent({
      aggregateId: ContentsIdMother.primitive(),
      size: FileSizeMother.random().value,
      path: FilePathMother.random().value,
      offlineContentsPath: FilePathMother.random().value,
      replaces: ContentsIdMother.primitive(),
    });
  }

  static doesNotReplace(): OfflineContentsUploadedDomainEvent {
    return new OfflineContentsUploadedDomainEvent({
      aggregateId: ContentsIdMother.primitive(),
      size: FileSizeMother.random().value,
      path: FilePathMother.random().value,
      offlineContentsPath: FilePathMother.random().value,
      replaces: undefined,
    });
  }
}
