import { OfflineContentsUploader } from '../../../../../src/context/offline-drive/contents/application/OfflineContentsUploader';
import { OfflineContentsManagersFactory } from '../../../../../src/context/offline-drive/contents/domain/OfflineContentsManagersFactory';
import { OfflineContentsName } from '../../../../../src/context/offline-drive/contents/domain/OfflineContentsName';
import { OfflineContentsRepository } from '../../../../../src/context/offline-drive/contents/domain/OfflineContentsRepository';
import { FilePath } from '../../../../../src/context/virtual-drive/files/domain/FilePath';
import { EventBus } from '../../../../../src/context/virtual-drive/shared/domain/EventBus';

export class OfflineContentsUploaderTestClass extends OfflineContentsUploader {
  public mock = jest.fn();

  constructor() {
    super(
      {} as OfflineContentsRepository,
      {} as OfflineContentsManagersFactory,
      {} as EventBus
    );
  }

  run(name: OfflineContentsName, path: FilePath) {
    return this.mock(name, path);
  }
}
