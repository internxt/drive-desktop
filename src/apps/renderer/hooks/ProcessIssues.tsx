import { useEffect, useState } from 'react';
import { ProcessIssue } from '../../shared/types';

export default function useProcessIssues() {
  const [processIssues, setProcessIssues] = useState<ProcessIssue[]>([]);

  useEffect(() => {
    window.electron.getProcessIssues().then(setProcessIssues);
    const removeListener =
      window.electron.onProcessIssuesChanged(setProcessIssues);

    return removeListener;
  }, []);

  return processIssues;
}
