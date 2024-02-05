import { tryAgain } from './shared-actions';
import { FatalErrorActionMap } from './types';

const selectRootSyncFolder = async () => {
  const result = await window.electron.chooseSyncRootWithDialog();
  if (result) {
    window.electron.startSyncProcess();
  }
};

export const syncErrorActions: FatalErrorActionMap = {
  CANNOT_ACCESS_BASE_DIRECTORY: {
    name: 'issues.actions.select-folder',
    func: selectRootSyncFolder,
  },
  CANNOT_ACCESS_TMP_DIRECTORY: tryAgain,
  CANNOT_GET_CURRENT_LISTINGS: tryAgain,
  NO_INTERNET: tryAgain,
  NO_REMOTE_CONNECTION: tryAgain,
  BASE_DIRECTORY_DOES_NOT_EXIST: {
    name: 'issues.actions.select-folder',
    func: selectRootSyncFolder,
  },
  INSUFFICIENT_PERMISSION_ACCESSING_BASE_DIRECTORY: tryAgain,
  UNKNOWN: tryAgain,
};
