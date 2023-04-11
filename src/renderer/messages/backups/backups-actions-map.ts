import { ProcessFatalErrorName } from '../../../workers/types';

export type FaltalErrorAction = { name: string; fn: () => void };

const map: Partial<Record<ProcessFatalErrorName, FaltalErrorAction>> = {
  BASE_DIRECTORY_DOES_NOT_EXIST: {
    name: 'View Error',
    fn: window.electron.openProcessIssuesWindow,
  },
} as const;


function obtainErrorAction(
  errorName: ProcessFatalErrorName
): FaltalErrorAction | undefined {
  return map[errorName];
}

export default obtainErrorAction;
