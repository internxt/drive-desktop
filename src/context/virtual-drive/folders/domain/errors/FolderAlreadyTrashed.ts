import { DriveDesktopError } from '../../../../shared/domain/errors/DriveDesktopError';

export class FolderAlreadyTrashed extends DriveDesktopError {
  constructor(name: string) {
    super('ACTION_NOT_PERMITTED', `Folder ${name} is already in the trash`);
  }
}
