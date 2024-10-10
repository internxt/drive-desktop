import { useEffect, useState } from 'react';

export function useBackupsInterval() {
  const [backupsInterval, setBackupsInterval] = useState(-1);

  function refreshBackupsInterval() {
    window.electron.getBackupsInterval().then(setBackupsInterval);
  }

  async function updateBackupsInterval(interval: number) {
    await window.electron.setBackupsInterval(interval);
    refreshBackupsInterval();
  }

  useEffect(() => {
    refreshBackupsInterval();
  }, []);

  return {
    backupsInterval,
    updateBackupsInterval,
  };
}
