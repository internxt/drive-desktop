import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export interface LastBackupContextProps {
  lastBackupTimestamp: number | undefined;
  fromNow: (date?: string) => string;
  refreshLastBackupTimestamp: () => void;
}

export function useLastBackup(): LastBackupContextProps {
  const [lastBackupTimestamp, setLastBackupTimestamp] = useState<number | undefined>(undefined);

  function refreshLastBackupTimestamp() {
    window.electron.getLastBackupTimestamp().then(setLastBackupTimestamp);
  }

  useEffect(() => {
    refreshLastBackupTimestamp();
  }, []);

  function fromNow(date?: string): string {
    return dayjs(date || lastBackupTimestamp).fromNow();
  }

  return {
    lastBackupTimestamp,
    fromNow,
    refreshLastBackupTimestamp,
  };
}
