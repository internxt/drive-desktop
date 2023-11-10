import { ProcessFatalErrorName } from 'apps/shared/types';

export type BackupFatalError = {
  path: string;
  folderId: number;
  errorName: ProcessFatalErrorName;
};
