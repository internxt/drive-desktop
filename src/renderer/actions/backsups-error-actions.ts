import { tryAgain } from './shared-actions';
import { FatalErrorActionMap } from './types';

const findBackupFolder = async (error: { path: string }) => {
  const result = await window.electron.changeBackupPath(error.path);
  if (result) window.electron.startBackupsProcess();
};

export const backupsErrorActions: FatalErrorActionMap = {
  CANNOT_ACCESS_BASE_DIRECTORY: {
    name: 'Find folder',
    func: findBackupFolder,
  },
  CANNOT_ACCESS_TMP_DIRECTORY: tryAgain,
  CANNOT_GET_CURRENT_LISTINGS: tryAgain,
  NO_INTERNET: tryAgain,
  NO_REMOTE_CONNECTION: tryAgain,
  BASE_DIRECTORY_DOES_NOT_EXIST: {
    name: 'Find folder',
    func: findBackupFolder,
  },
  INSUFICIENT_PERMISION_ACCESSING_BASE_DIRECTORY: tryAgain,
  UNKNOWN: tryAgain,
};
