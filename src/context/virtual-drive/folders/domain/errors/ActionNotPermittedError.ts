import { DriveDesktopError } from '../../../../shared/domain/errors/DriveDesktopError';

export class ActionNotPermittedError extends DriveDesktopError {
  constructor(action: string) {
    super('ACTION_NOT_PERMITTED', `${action} is not permitted on folders`);
  }
}
