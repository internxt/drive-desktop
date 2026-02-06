import { useEffect, useState } from 'react';
const BACKUP_MANUAL_INTERVAL = -1;

export function useBackupsInterval() {
  const [backupsInterval, setBackupsInterval] = useState<number>(BACKUP_MANUAL_INTERVAL);

  async function updateBackupsInterval(interval: number) {
    setBackupsInterval(interval);
    await window.electron.setBackupsInterval(interval);
  }

  async function retrieveBackupsInterval(): Promise<number> {
    return await window.electron.getBackupsInterval();
  }

  useEffect(() => {
    retrieveBackupsInterval().then(setBackupsInterval);
  }, []);

  return {
    backupsInterval,
    updateBackupsInterval,
  };
}
