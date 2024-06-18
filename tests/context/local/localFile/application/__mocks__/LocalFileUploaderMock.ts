import { LocalFileHandler } from '../../../../../../src/context/local/localFile/domain/LocalFileUploader';
import { AbsolutePath } from '../../../../../../src/context/local/localFile/infrastructure/AbsolutePath';
import { Either } from '../../../../../../src/context/shared/domain/Either';
import { DriveDesktopError } from '../../../../../../src/context/shared/domain/errors/DriveDesktopError';

export class LocalFileUploaderMock implements LocalFileHandler {
  private readonly uploadMock = jest.fn();
  private readonly deleteMock = jest.fn();

  upload(
    path: AbsolutePath,
    size: number,
    abortSignal: AbortSignal
  ): Promise<Either<DriveDesktopError, string>> {
    return this.uploadMock(path, size, abortSignal);
  }

  delete(contentsId: string): Promise<void> {
    return this.deleteMock(contentsId);
  }
}
