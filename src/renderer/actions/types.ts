import { ProcessFatalErrorName } from '../../workers/types';
import { BackupFatalError } from '../../main/background-processes/backups';

export interface Action {
  name: string;
  func: (error: BackupFatalError | undefined) => Promise<void> | void;
}

export type FatalErrorActionMap = Record<ProcessFatalErrorName, Action>;
