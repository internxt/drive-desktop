import { FatalError } from '../../../../shared/issues/FatalError';

export type FaltalErrorAction = { name: string; fn: () => void };

const map: Partial<Record<FatalError, FaltalErrorAction>> = {
  BASE_DIRECTORY_DOES_NOT_EXIST: {
    name: 'View Error',
    fn: window.electron.openProcessIssuesWindow,
  },
} as const;

function obtainErrorAction(
  errorName: FatalError
): FaltalErrorAction | undefined {
  return map[errorName];
}

export default obtainErrorAction;
