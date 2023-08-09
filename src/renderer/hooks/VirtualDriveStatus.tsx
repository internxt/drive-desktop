import { useEffect, useState } from 'react';
import { reportError } from 'renderer/utils/errors';
import { VirtualDriveStatus } from '../../shared/types/VirtualDriveStatus';

export default function useVirtualDriveStatus() {
  const [status, setStatus] = useState<VirtualDriveStatus>();
  useEffect(() => {
    window.electron
      .getVirtualDriveStatus()
      .then(setStatus)
      .catch((err) => {
        reportError(err);
      });

    const removeListener = window.electron.onVirtualDriveStatusChange(
      ({ status }) => {
        setStatus(status);
      }
    );

    return removeListener;
  }, []);

  return { status };
}
