import { Service } from 'diod';
import { parseRetryAfterMs } from '../../../../../backend/common/rate-limit/transient-error-handler';
import { DriveDesktopError } from '../../../../shared/domain/errors/DriveDesktopError';
import { EventBus } from '../../../shared/domain/EventBus';
import { File } from '../../domain/File';
import { FileRepository } from '../../domain/FileRepository';
import { FileSize } from '../../domain/FileSize';
import { FileNotFoundError } from '../../domain/errors/FileNotFoundError';
import { FileContentsId } from '../../domain/FileContentsId';
import { overrideFile } from '../../../../../infra/drive-server/services/files/services/override-file';
import { DriveServerError } from '../../../../../infra/drive-server/drive-server.error';

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
  ): Promise<File> {
    const file = await this.repository.searchByContentsId(oldContentsId);

    if (!file) {
      throw new FileNotFoundError(oldContentsId);
    }

    file.changeContents(new FileContentsId(newContentsId), new FileSize(newSize));

    const result = await overrideFile({
      fileUuid: file.uuid,
      fileContentsId: file.contentsId,
      fileSize: file.size,
    });

    if (result.error) {
      throw mapOverrideFileError(result.error);
    }

    await this.repository.update(file);

    this.eventBus.publish(file.pullDomainEvents());

    return file;
  }
}

function mapOverrideFileError(error: DriveServerError): DriveDesktopError {
  if (error.cause === 'FILE_TOO_BIG') {
    return new DriveDesktopError('FILE_TOO_BIG', error.message);
  }

  if (error.cause === 'TOO_MANY_REQUESTS') {
    return new DriveDesktopError('RATE_LIMITED', String(parseRetryAfterMs(error.message)));
  }

  if (error.cause === 'SERVER_ERROR') {
    return new DriveDesktopError('INTERNAL_SERVER_ERROR', error.message);
  }

  return new DriveDesktopError('UNKNOWN', error.message);
}
