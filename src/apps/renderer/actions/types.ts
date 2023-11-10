import { ProcessFatalErrorName } from 'apps/shared/types';
import { BackupFatalError } from '../../main/background-processes/types/BackupFatalError';

export interface Action {
  name: string;
  func: (() => void) | ((error: BackupFatalError | undefined) => Promise<void>);
}

export type FatalErrorActionMap = Record<ProcessFatalErrorName, Action>;
