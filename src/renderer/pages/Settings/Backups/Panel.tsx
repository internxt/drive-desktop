import { useEffect, useState } from 'react';
import Button from '../../../components/Button';
import Checkbox from '../../../components/Checkbox';
import useBackupStatus from '../../../hooks/BackupStatus';
import Dropdown from './Dropdown';

export default function BackupsPanel({
  onGoToList,
}: {
  onGoToList: () => void;
}) {
  const [backupsInterval, setBackupsInterval] = useState(-1);
  const [backupsEnabled, setBackupsEnabled] = useState(false);

  const backupStatus = useBackupStatus();

  function refreshBackupsInterval() {
    window.electron.getBackupsInterval().then(setBackupsInterval);
  }

  function refreshBackupsEnabled() {
    window.electron.getBackupsEnabled().then(setBackupsEnabled);
  }

  useEffect(() => {
    refreshBackupsInterval();
    refreshBackupsEnabled();
  }, []);

  async function onBackupsIntervalChanged(newValue: number) {
    await window.electron.setBackupsInterval(newValue);
    refreshBackupsInterval();
  }

  async function onBackupsEnabledClicked() {
    await window.electron.toggleBackupsEnabled();
    refreshBackupsEnabled();
  }

  return (
    <>
      <div className="flex items-baseline space-x-2">
        <Checkbox
          value={backupsEnabled}
          label="Back up your folders and files"
          onClick={onBackupsEnabledClicked}
        />
        <a
          className="text-xs font-medium text-blue-60 underline"
          href="https://drive.internxt.com/app/backups"
          target="_blank"
          rel="noopener noreferrer"
        >
          View your backups
        </a>
      </div>
      <Button className="mt-2" onClick={onGoToList}>
        Select folders to backup
      </Button>
      <div className="flex items-baseline">
        <Button
          variant={backupStatus === 'STANDBY' ? 'primary' : 'danger'}
          className="mt-2"
          onClick={
            backupStatus === 'STANDBY'
              ? window.electron.startBackupsProcess
              : window.electron.stopBackupsProcess
          }
        >
          {backupStatus === 'STANDBY' ? 'Backup now' : 'Stop backup'}
        </Button>
        <p className="ml-3 text-xs text-m-neutral-100">
          Updated 23 minutes ago
        </p>
      </div>
      <p className="mt-6 text-xs text-neutral-500">Upload frequency</p>
      <Dropdown value={backupsInterval} onChange={onBackupsIntervalChanged} />
    </>
  );
}
