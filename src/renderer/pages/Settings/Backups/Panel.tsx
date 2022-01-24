import { useEffect, useState } from 'react';
import Button from '../../../components/Button';
import Dropdown from './Dropdown';

export default function BackupsPanel({
  onGoToList,
}: {
  onGoToList: () => void;
}) {
  const [backupsInterval, setBackupsInterval] = useState(-1);

  function refreshBackupsInterval() {
    window.electron.getBackupsInterval().then(setBackupsInterval);
  }

  useEffect(() => {
    refreshBackupsInterval();
  }, []);

  async function onBackupsIntervalChanged(newValue: number) {
    await window.electron.setBackupsInterval(newValue);
    refreshBackupsInterval();
  }

  return (
    <>
      <div className="flex items-baseline space-x-2">
        <input type="checkbox" />
        <p className="text-neutral-700">Back up your folders and files</p>
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
        <Button variant="primary" className="mt-2">
          Backup now
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
