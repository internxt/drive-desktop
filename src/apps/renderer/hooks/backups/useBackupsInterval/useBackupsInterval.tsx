import { useEffect, useState } from 'react';
const BACKUP_MANUAL_INTERVAL = -1;

export function useBackupsInterval() {
  const [backupsInterval, setBackupsInterval] = useState<number>(BACKUP_MANUAL_INTERVAL);

  function handleSetBackupsInterval(interval: number) {
    setBackupsInterval(interval);
  }

  async function updateBackupsInterval(interval: number) {
    handleSetBackupsInterval(interval);
    await window.electron.setBackupsInterval(interval);
  }

  async function retrieveBackupsInterval(): Promise<number> {
    return await window.electron.getBackupsInterval();
  }

  useEffect(() => {
    retrieveBackupsInterval().then(handleSetBackupsInterval);
  }, []);

  return {
    backupsInterval,
    updateBackupsInterval,
  };
}
