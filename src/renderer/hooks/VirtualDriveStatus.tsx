import { useEffect, useState } from 'react';
import { reportError } from 'renderer/utils/errors';

export default function useVirtualDriveStatus() {
  const [status, setStatus] = useState<string>();
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
