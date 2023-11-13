import { ProcessFatalErrorName } from 'apps/shared/types';

export interface Action {
  name: string;
  func: (() => void) | ((error: undefined) => Promise<void>);
}

export type FatalErrorActionMap = Record<ProcessFatalErrorName, Action>;
