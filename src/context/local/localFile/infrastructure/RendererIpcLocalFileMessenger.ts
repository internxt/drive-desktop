import { Service } from 'diod';
import { BackupsIPCRenderer } from '../../../../apps/backups/BackupsIPCRenderer';
import { LocalFile } from '../domain/LocalFile';
import { LocalFileMessenger } from '../domain/LocalFileMessenger';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';

@Service()
export class RendererIpcLocalFileMessenger implements LocalFileMessenger {
  async creationFailed(
    file: LocalFile,
    error: DriveDesktopError
  ): Promise<void> {
    BackupsIPCRenderer.send(
      'backups.file-issue',
      file.nameWithExtension(),
      error.cause
    );
  }
}
