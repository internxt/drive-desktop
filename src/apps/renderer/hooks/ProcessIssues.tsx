import { useEffect, useState } from 'react';
import { VirtualDriveIssue } from '../../../shared/issues/VirtualDriveIssue';

export default function useVirtualDriveIssues() {
  const [virtualDriveIssues, setVirtualDriveIssues] = useState<
    VirtualDriveIssue[]
  >([]);

  useEffect(() => {
    window.electron.getVirtualDriveIssues().then(setVirtualDriveIssues);
    const removeListener = window.electron.onProcessIssuesChanged(
      setVirtualDriveIssues
    );

    return removeListener;
  }, []);

  return virtualDriveIssues;
}
