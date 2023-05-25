import { Action } from './types';

export const tryAgain: Action = {
	name: 'issues.actions.try-again',
	func: window.electron.startBackupsProcess,
};
