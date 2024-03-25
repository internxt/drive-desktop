import { OfflineContentsUploadedDomainEvent } from '../../../../../../src/context/offline-drive/contents/domain/events/OfflineContentsUploadedDomainEvent';
import { FileSizeMother } from '../FileSizeMother';
import { FilePathMother } from '../FilePathMother';
import { ContentsIdMother } from '../../../contents/domain/ContentsIdMother';

export class OfflineContentsUploadedDomainEventMother {
  static any(): OfflineContentsUploadedDomainEvent {
    return new OfflineContentsUploadedDomainEvent({
      aggregateId: ContentsIdMother.primitive(),
      size: FileSizeMother.random().value,
      path: FilePathMother.random().value,
      offlineContentsPath: FilePathMother.random().value,
    });
  }
}
