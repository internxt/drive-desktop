import { Service } from 'diod';
import { EventBus } from '../../../shared/domain/EventBus';
import { File } from '../../domain/File';
import { FileRepository } from '../../domain/FileRepository';
import { FileSize } from '../../domain/FileSize';
import { FileNotFoundError } from '../../domain/errors/FileNotFoundError';
import { FileContentsId } from '../../domain/FileContentsId';
import { overrideFile } from '../../../../../infra/drive-server/services/files/services/override-file';

@Service()
export class FileOverrider {
  constructor(
    private readonly repository: FileRepository,
    private readonly eventBus: EventBus,
  ) {}

  async run(
    oldContentsId: File['contentsId'],
    newContentsId: File['contentsId'],
    newSize: File['size'],
  ): Promise<void> {
    const file = await this.repository.searchByContentsId(oldContentsId);

    if (!file) {
      throw new FileNotFoundError(oldContentsId);
    }

    file.changeContents(new FileContentsId(newContentsId), new FileSize(newSize));

    await overrideFile({
      fileUuid: file.uuid,
      fileContentsId: file.contentsId,
      fileSize: file.size,
    });

    await this.repository.update(file);

    this.eventBus.publish(file.pullDomainEvents());
  }
}
