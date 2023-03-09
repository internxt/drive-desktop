import { useEffect, useState } from 'react';
import { GeneralIssue } from '../../workers/types';

export default function useGeneralIssues() {
  const [generalIssues, setGeneralIssues] = useState<GeneralIssue[]>([]);

  useEffect(() => {
    window.electron.getGeneralIssues().then(setGeneralIssues);
    const removeListener =
      window.electron.onGeneralIssuesChanged(setGeneralIssues);
    return removeListener;
  }, []);

  return generalIssues;
}
