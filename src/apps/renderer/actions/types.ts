import { FatalError } from '../../../shared/issues/FatalError';

export interface Action {
  name: string;
  func: (() => void) | ((error: undefined) => Promise<void>);
}

export type FatalErrorActionMap = Record<FatalError, Action>;
