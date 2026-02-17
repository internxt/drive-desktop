import { LocalFileHandler } from '../../domain/LocalFileUploader';
import { AbsolutePath } from '../../infrastructure/AbsolutePath';
import { Either } from '../../../../shared/domain/Either';
import { DriveDesktopError } from '../../../../shared/domain/errors/DriveDesktopError';
import { vi } from 'vitest';

export class LocalFileUploaderMock implements LocalFileHandler {
  private readonly uploadMock = vi.fn();
  private readonly deleteMock = vi.fn();

  upload(path: AbsolutePath, size: number, abortSignal: AbortSignal): Promise<Either<DriveDesktopError, string>> {
    return this.uploadMock(path, size, abortSignal);
  }
}
