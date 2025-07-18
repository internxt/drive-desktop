import { DriveServerWipError, TDriveServerWipError } from '@/infra/drive-server-wip/out/error.types';

export class GetDeviceError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'NOT_FOUND' | 'ALREADY_EXISTS',
    cause: unknown,
  ) {
    super(code, cause);
  }
}
