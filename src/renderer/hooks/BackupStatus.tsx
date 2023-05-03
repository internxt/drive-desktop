import { useEffect, useState } from 'react';

import { BackupsStatus } from '../../main/background-processes/backups';

export default function useBackupStatus(): BackupsStatus {
	const [backupStatus, setBackupStatus] = useState<BackupsStatus>('STANDBY');
	useEffect(() => {
		window.electron.getBackupsStatus().then(setBackupStatus);

		const removeListener = window.electron.onBackupsStatusChanged(setBackupStatus);

		return removeListener;
	}, []);

	return backupStatus;
}
