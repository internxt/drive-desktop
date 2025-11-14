import { DriveServerWipError, TDriveServerWipError } from '@/infra/drive-server-wip/out/error.types';

export class DeviceError extends DriveServerWipError {
  constructor(
    public readonly code: TDriveServerWipError | 'NOT_FOUND' | 'ALREADY_EXISTS' | 'MULTIPLE_DEVICES_FOUND' | 'ALREADY_HAS_IDENTIFIER',
    cause: unknown,
  ) {
    super(code, cause);
  }
}
