import { OfflineContentsUploadedDomainEvent } from '../../../../../../src/context/offline-drive/contents/domain/events/OfflineContentsUploadedDomainEvent';
import { UuidMother } from '../../../../shared/domain/UuidMother';
import { FileSizeMother } from '../FileSizeMother';
import { FilePathMother } from '../FilePathMother';
import { ContentsIdMother } from '../../../contents/domain/ContentsIdMother';

export class OfflineContentsUploadedDomainEventMother {
  static any(): OfflineContentsUploadedDomainEvent {
    return new OfflineContentsUploadedDomainEvent({
      aggregateId: UuidMother.random().value,
      contentsId: ContentsIdMother.primitive(),
      size: FileSizeMother.random().value,
      path: FilePathMother.random().value,
      offlineContentsPath: FilePathMother.random().value,
    });
  }
}
