import { useEffect, useState } from 'react';
import { AppIssue } from '../../../shared/issues/AppIssue';

export default function useGeneralIssues() {
  const [generalIssues, setGeneralIssues] = useState<AppIssue[]>([]);

  useEffect(() => {
    window.electron.getGeneralIssues().then(setGeneralIssues);
    const removeListener =
      window.electron.onGeneralIssuesChanged(setGeneralIssues);

    return removeListener;
  }, []);

  return { generalIssues };
}
