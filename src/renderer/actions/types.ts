import { BackupFatalError } from '../../main/background-processes/types/BackupFatalError';
import { ProcessFatalErrorName } from '../../workers/types';

export interface Action {
  name: string;
  func: (() => void) | ((error: BackupFatalError | undefined) => Promise<void>);
}

export type FatalErrorActionMap = Record<ProcessFatalErrorName, Action>;
