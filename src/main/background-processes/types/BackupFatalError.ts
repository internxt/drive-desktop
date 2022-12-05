import { ProcessFatalErrorName } from '../../../workers/types';

export type BackupFatalError = {
  path: string;
  folderId: number;
  errorName: ProcessFatalErrorName;
};
