import { FilePath } from '../../../virtual-drive/files/domain/FilePath';
import { FileSize } from '../../../virtual-drive/files/domain/FileSize';
import { EventBus } from '../../../virtual-drive/shared/domain/EventBus';
import { OfflineFile } from '../domain/OfflineFile';
import { OfflineFileFileSystem } from '../domain/OfflineFileFileSystem';
import { OfflineFileRepository } from '../domain/OfflineFileRepository';
import * as uuid from 'uuid';

export class CreateOfflineFile {
  constructor(
    private readonly repository: OfflineFileRepository,
    private readonly offlineFileSystem: OfflineFileFileSystem,
    private readonly eventBus: EventBus
  ) {}

  async run(path: string): Promise<void> {
    const id = uuid.v4();
    const createdAt = Date.now();
    const filePath = new FilePath(path);
    const size = new FileSize(0);

    const file = OfflineFile.create(id, createdAt, filePath, size);

    await this.offlineFileSystem.createEmptyFile(file.id);

    await this.repository.save(file);
    await this.eventBus.publish(file.pullDomainEvents());
  }
}
