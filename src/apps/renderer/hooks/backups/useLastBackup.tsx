import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { WorkerExitCause } from '../../../main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { isFatalError } from '../../../../shared/issues/SyncErrorCause';

dayjs.extend(relativeTime);

export function useLastBackup() {
  const [lastBackupTimestamp, setLastBackupTimestamp] = useState<
    number | undefined
  >(undefined);

  const [lastExistReason, setLastExistReason] = useState<WorkerExitCause>();
  const [lastBackupHadIssues, setLastBackupHadIssues] =
    useState<boolean>(false);

  function refreshLastBackupTimestamp() {
    window.electron.getLastBackupTimestamp().then(setLastBackupTimestamp);
  }

  function refreshLastExitReason() {
    window.electron.getLastBackupExitReason().then((reason) => {
      setLastExistReason(reason);
      setLastBackupHadIssues(isFatalError(reason));
    });
  }

  useEffect(() => {
    refreshLastBackupTimestamp();
  }, []);

  useEffect(() => {
    refreshLastExitReason();
  }, [lastBackupTimestamp]);

  function fromNow(): string {
    return dayjs(lastBackupTimestamp).fromNow();
  }

  return {
    lastBackupTimestamp,
    lastExistReason,
    fromNow,
    lastBackupHadIssues,
  };
}
