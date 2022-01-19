import { useEffect, useState } from 'react';
import { SyncInfoUpdatePayload } from '../../workers/sync';

export default function useSyncIssues() {
  const [syncIssues, setSyncIssues] = useState<SyncInfoUpdatePayload[]>([]);

  useEffect(() => {
    window.electron.getSyncIssues().then(setSyncIssues);
    const removeListener = window.electron.onSyncIssuesChanged(setSyncIssues);
    return removeListener;
  }, []);

  return syncIssues;
}
