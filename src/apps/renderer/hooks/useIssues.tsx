import { useEffect, useMemo, useState } from 'react';
import { Issue } from '@/apps/main/background-processes/issues';

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);

  const { syncIssues, backupIssues, generalIssues } = useMemo(() => {
    const syncIssues = issues.filter((issue) => issue.tab === 'sync');
    const backupIssues = issues.filter((issue) => issue.tab === 'backups');
    const generalIssues = issues.filter((issue) => issue.tab === 'general');
    return { syncIssues, backupIssues, generalIssues };
  }, [issues]);

  useEffect(() => {
    void window.electron.getIssues().then(setIssues);

    const removeListener = window.electron.onIssuesChanged(setIssues);
    return removeListener;
  }, []);

  return {
    issues,
    syncIssues,
    backupIssues,
    generalIssues,
  };
}
