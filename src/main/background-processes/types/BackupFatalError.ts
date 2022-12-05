import { ProcessFatalErrorName } from '../../../workers/types';

type BackupFatalError = {
  path: string;
  folderId: number;
  errorName: ProcessFatalErrorName;
};

export default BackupFatalError;
