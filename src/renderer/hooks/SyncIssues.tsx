import { useEffect, useState } from 'react';
import { SyncIssue } from '../../workers/sync';

export default function useSyncIssues() {
  const [syncIssues, setSyncIssues] = useState<SyncIssue[]>([]);

  useEffect(() => {
    window.electron.getSyncIssues().then(setSyncIssues);
    const removeListener = window.electron.onSyncIssuesChanged(setSyncIssues);
    return removeListener;
  }, []);

  return syncIssues;
}
