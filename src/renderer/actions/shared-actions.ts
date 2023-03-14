import { Action } from './types';

export const tryAgain: Action = {
  name: 'Try again',
  func: window.electron.startBackupsProcess,
};
