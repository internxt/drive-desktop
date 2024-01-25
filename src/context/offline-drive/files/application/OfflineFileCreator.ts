import { FilePath } from '../../../virtual-drive/files/domain/FilePath';
import { FileSize } from '../../../virtual-drive/files/domain/FileSize';
import { EventBus } from '../../../virtual-drive/shared/domain/EventBus';
import { OfflineFile } from '../domain/OfflineFile';
import { OfflineFileRepository } from '../domain/OfflineFileRepository';

export class OfflineFileCreator {
  constructor(
    private readonly repository: OfflineFileRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(path: string): Promise<OfflineFile> {
    const filePath = new FilePath(path);
    const size = new FileSize(0);

    const file = OfflineFile.create(filePath, size);

    await this.repository.save(file);

    await this.eventBus.publish(file.pullDomainEvents());

    return file;
  }
}
