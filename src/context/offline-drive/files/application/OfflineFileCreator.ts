import { FilePath } from '../../../virtual-drive/files/domain/FilePath';
import { EventBus } from '../../../virtual-drive/shared/domain/EventBus';
import { OfflineFile } from '../domain/OfflineFile';
import { OfflineFileRepository } from '../domain/OfflineFileRepository';
import { OfflineFileSize } from '../domain/OfflineFileSize';

export class OfflineFileCreator {
  constructor(
    private readonly repository: OfflineFileRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(path: string): Promise<OfflineFile> {
    const filePath = new FilePath(path);
    const size = new OfflineFileSize(0);

    const file = OfflineFile.create(filePath, size);

    await this.repository.save(file);

    await this.eventBus.publish(file.pullDomainEvents());

    return file;
  }
}
