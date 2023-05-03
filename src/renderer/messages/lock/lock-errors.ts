import { LockErrorReason } from '../../../main/background-processes/lock-erros';

const lockErrorMessages: Record<LockErrorReason, string> = {
	FOLDER_IS_LOCKED: 'Looks like other of your devices are already syncing, we\'ll try again later',
	SERVICE_UNAVAILABE: 'We cannot perform the action at the moment, please try again later',
	UNKNONW_LOCK_SERVICE_ERROR: 'An unknown error has occurred',
	LOCK_UNAUTHORIZED:
		'Your session has expired, if the app does not log out shortly please log out manually',
};

function obtainLockErrorMessage(reason: LockErrorReason): string {
	return lockErrorMessages[reason];
}

export default obtainLockErrorMessage;
