import { VirtualDriveError } from '../../../../shared/issues/VirtualDriveError';
import { TrackedActions } from '../../../shared/IPC/events/sync-engine';

export const virtualDriveErrorToTrackedActionsMap = new Map<
  VirtualDriveError,
  TrackedActions
>([
  ['UPLOAD_ERROR', 'Upload Error'],
  ['DOWNLOAD_ERROR', 'Download Error'],
  ['RENAME_ERROR', 'Rename Error'],
  ['DELETE_ERROR', 'Delete Error'],
  // FOLDERS
  ['FOLDER_RENAME_ERROR', 'Rename Error'],
  ['FOLDER_CREATE_ERROR', 'Upload Error'],
]);
