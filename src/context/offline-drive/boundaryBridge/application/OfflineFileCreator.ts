import { FilePath } from '../../../virtual-drive/files/domain/FilePath';
import { FileSize } from '../../../virtual-drive/files/domain/FileSize';
import { EventBus } from '../../../virtual-drive/shared/domain/EventBus';
import { OfflineFile } from '../../files/domain/OfflineFile';
import { OfflineContentsRepository } from '../../contents/domain/OfflineContentsRepository';
import { OfflineFileRepository } from '../../files/domain/OfflineFileRepository';
import * as uuid from 'uuid';

export class OfflineFileCreator {
  constructor(
    private readonly fileRepository: OfflineFileRepository,
    private readonly contentsRepository: OfflineContentsRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(path: string): Promise<void> {
    const id = uuid.v4();
    const createdAt = Date.now();
    const filePath = new FilePath(path);
    const size = new FileSize(0);

    const file = OfflineFile.create(id, createdAt, filePath, size);

    await this.contentsRepository.createEmptyFile(file.id);

    await this.fileRepository.save(file);

    await this.eventBus.publish(file.pullDomainEvents());
  }
}
