import {
  FileNotFoundVirtualDriveError,
  VirtualDriveError,
} from '../../errors/VirtualDriveError';

const VirtualDriveErrorToStatusMap = new Map([
  [typeof FileNotFoundVirtualDriveError, 404],
]);

export function getStatusForError(error: VirtualDriveError): number {
  const status = VirtualDriveErrorToStatusMap.get(typeof error);

  return status || 500;
}
