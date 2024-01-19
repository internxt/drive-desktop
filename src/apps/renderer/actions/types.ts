import { ProcessFatalErrorName } from '../../../shared/issues/VirtualDriveIssue';

export interface Action {
  name: string;
  func: (() => void) | ((error: undefined) => Promise<void>);
}

export type FatalErrorActionMap = Record<ProcessFatalErrorName, Action>;
