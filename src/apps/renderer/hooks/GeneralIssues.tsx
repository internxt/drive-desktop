import { useEffect, useState } from 'react';
import { GeneralIssue } from '@/apps/main/background-processes/issues';

export function useGeneralIssues() {
  const [generalIssues, setGeneralIssues] = useState<GeneralIssue[]>([]);

  useEffect(() => {
    window.electron.getGeneralIssues().then(setGeneralIssues);
    const removeListener = window.electron.onGeneralIssuesChanged(setGeneralIssues);

    return removeListener;
  }, []);

  return { generalIssues };
}
