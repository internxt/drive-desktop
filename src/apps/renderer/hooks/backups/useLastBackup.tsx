import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export interface LastBackupContextProps {
  lastBackupTimestamp: number | undefined;
  fromNow: () => string;
  lastBackupHadIssues: boolean;
  refreshLastBackupTimestamp: () => void;
}

export function useLastBackup(): LastBackupContextProps {
  const [lastBackupTimestamp, setLastBackupTimestamp] = useState<number | undefined>(undefined);
  const [lastBackupHadIssues, setLastBackupHadIssues] = useState<boolean>(false);

  function refreshLastBackupTimestamp() {
    window.electron.getLastBackupTimestamp().then(setLastBackupTimestamp);
  }

  function refreshLastBackupHadIssues() {
    window.electron.getLastBackupHadIssues().then(setLastBackupHadIssues);
  }

  useEffect(() => {
    refreshLastBackupTimestamp();
  }, []);

  useEffect(() => {
    refreshLastBackupHadIssues();
  }, [lastBackupTimestamp]);

  function fromNow(): string {
    return dayjs(lastBackupTimestamp).fromNow();
  }

  return {
    lastBackupTimestamp,
    fromNow,
    lastBackupHadIssues,
    refreshLastBackupTimestamp,
  };
}
