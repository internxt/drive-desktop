import { useEffect, useState } from 'react';
import { Issue } from '@/apps/main/background-processes/issues';

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    void window.electron.getIssues().then(setIssues);

    const removeListener = window.electron.onIssuesChanged(setIssues);
    return removeListener;
  }, []);

  return { issues };
}
