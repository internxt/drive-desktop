import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useEffect, useState } from 'react';

import { BackupProgress } from '../../../../main/background-processes/backups';
import Button from '../../../components/Button';
import Checkbox from '../../../components/Checkbox';
import { useTranslationContext } from '../../../context/LocalContext';
import useBackupStatus from '../../../hooks/BackupStatus';
import { getPercentualProgress } from '../../../utils/backups-progress';
import Dropdown from './Dropdown';

dayjs.extend(relativeTime);

export default function BackupsPanel({ onGoToList }: { onGoToList: () => void }) {
	const [backupsInterval, setBackupsInterval] = useState(-1);
	const [backupsEnabled, setBackupsEnabled] = useState(false);
	const [lastBackupTimestamp, setLastBackupTimestamp] = useState(-1);
	const [backupProgress, setBackupProgress] = useState<null | BackupProgress>(null);
	const { translate, language } = useTranslationContext();

	dayjs.locale(language);

	const backupStatus = useBackupStatus();

	useEffect(() => {
		if (backupStatus === 'STANDBY') {
			setBackupProgress(null);
		}
	}, [backupStatus]);

	function refreshBackupsInterval() {
		window.electron.getBackupsInterval().then(setBackupsInterval);
	}

	function refreshBackupsEnabled() {
		window.electron.getBackupsEnabled().then(setBackupsEnabled);
	}

	function refreshLastBackupTimestamp() {
		window.electron.getLastBackupTimestamp().then(setLastBackupTimestamp);
	}

	useEffect(() => {
		refreshBackupsInterval();
		refreshBackupsEnabled();
	}, []);

	useEffect(() => {
		const removeListener = window.electron.onBackupProgress(setBackupProgress);

		return removeListener;
	}, []);

	useEffect(refreshLastBackupTimestamp, [backupStatus]);

	async function onBackupsIntervalChanged(newValue: number) {
		await window.electron.setBackupsInterval(newValue);
		refreshBackupsInterval();
	}

	async function onBackupsEnabledClicked() {
		await window.electron.toggleBackupsEnabled();
		refreshBackupsEnabled();
	}

	const progressDisplay = backupProgress
		? `(${getPercentualProgress(backupProgress).toFixed(0)}%)`
		: '';

	return (
		<>
			<div className="flex items-baseline space-x-2">
				<Checkbox
					value={backupsEnabled}
					label={translate('settings.backups.activate')}
					onClick={onBackupsEnabledClicked}
				/>
				<a
					className="text-right text-xs font-medium text-blue-60 underline"
					href="https://drive.internxt.com/app/backups"
					target="_blank"
					rel="noopener noreferrer"
				>
					{translate('settings.backups.view-backups')}
				</a>
			</div>
			<Button className="mt-2" onClick={onGoToList}>
				{translate('settings.backups.select-folders')}
			</Button>
			<div className="flex items-baseline">
				<Button
					variant={backupStatus === 'STANDBY' ? 'primary' : 'danger'}
					disabled={!backupsEnabled}
					className="mt-2"
					onClick={
						backupStatus === 'STANDBY'
							? window.electron.startBackupsProcess
							: window.electron.stopBackupsProcess
					}
				>
					{translate(`settings.backups.action.${backupStatus === 'STANDBY' ? 'start' : 'stop'}`)}
				</Button>
				<p className="ml-3 text-xs text-m-neutral-100">
					{backupStatus === 'STANDBY'
						? lastBackupTimestamp !== -1
							? `${translate('settings.backups.action.last-run')} ${dayjs(
									lastBackupTimestamp
							  ).fromNow()}`
							: ''
						: `Backup in progress ${progressDisplay}`}
				</p>
			</div>
			<p className="mt-6 text-xs text-neutral-500">
				{translate('settings.backups.frequency.title')}
			</p>
			<Dropdown value={backupsInterval} onChange={onBackupsIntervalChanged} />
		</>
	);
}
