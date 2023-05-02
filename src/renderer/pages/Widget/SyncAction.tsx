import { useEffect, useState } from 'react';

import { SyncStatus } from '../../../main/background-processes/sync';
import PlayButton from '../../assets/play.svg';
import Spinner from '../../assets/spinner.svg';
import StopButton from '../../assets/stop.svg';
import { useTranslationContext } from '../../context/LocalContext';
import useSyncStatus from '../../hooks/SyncStatus';
import useSyncStopped from '../../hooks/SyncStopped';

export default function SyncAction() {
	const { translate } = useTranslationContext();

	const [state, setState] = useState<SyncStatus | 'LOADING'>('STANDBY');

	const [showUpdatedJustNow, setShowUpdatedJustNow] = useState(false);
	const [showLockError, setShowLockError] = useState(false);

	useSyncStatus(setState);

	const [syncStoppedReason] = useSyncStopped();

	useEffect(() => {
		if (state === 'STANDBY' && syncStoppedReason?.reason === 'COULD_NOT_ACQUIRE_LOCK') {
			setShowLockError(true);
			const timeout = setTimeout(() => setShowLockError(false), 1000 * 10);

			return () => {
				if (timeout) {
					clearTimeout(timeout);
				}
			};
		}
		if (state === 'STANDBY' && syncStoppedReason?.reason === 'EXIT') {
			setShowUpdatedJustNow(true);
			const timeout = setTimeout(() => setShowUpdatedJustNow(false), 1000 * 10);

			return () => {
				if (timeout) {
					clearTimeout(timeout);
				}
			};
		}
	}, [state]);

	const Button = state === 'STANDBY' ? PlayButton : state === 'RUNNING' ? StopButton : Spinner;

	function onClick() {
		setState('LOADING');

		if (state === 'STANDBY') {
			window.electron.startSyncProcess();
		} else {
			window.electron.stopSyncProcess();
		}
	}

	return (
		<div className="flex items-center justify-between border-t border-t-l-neutral-30 bg-white px-3 py-1">
			<p className="text-xs text-neutral-500">
				{state === 'STANDBY' && showLockError ? translate('widget.footer.errors.lock') : ''}
				{state === 'RUNNING'
					? translate('widget.footer.action-description.syncing')
					: showUpdatedJustNow
					? translate('widget.footer.action-description.updated')
					: ''}
			</p>
			<Button
				tabIndex={0}
				onClick={() => state !== 'LOADING' && onClick()}
				onKeyPress={() => state !== 'LOADING' && onClick()}
				className={`h-7 w-7 rounded fill-blue-60 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-offset-blue-60 ${
					state !== 'LOADING' ? 'cursor-pointer' : 'animate-spin'
				}`}
			/>
		</div>
	);
}
