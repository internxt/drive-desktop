import { useEffect, useState } from 'react';
import { FuseDriveStatus } from '../../drive/fuse/FuseDriveStatus';

export default function useVirtualDriveStatus() {
  const [virtualDriveStatus, setVirtualDriveStatus] = useState<FuseDriveStatus>();

  useEffect(() => {
    window.electron
      .getVirtualDriveStatus()
      .then((status: FuseDriveStatus) => setVirtualDriveStatus(status))
      .catch((err) => {
        window.electron.logger.error({
          msg: '[RENDERER] Failed to fetch virtual drive status',
          error: err,
        });
      });
  }, []);

  useEffect(() => {
    const removeListener = window.electron.onVirtualDriveStatusChange((status) => {
      window.electron.logger.debug({
        msg: '[RENDERER] Virtual drive status changed',
        status,
      });
      setVirtualDriveStatus(status.status);
    });

    return removeListener;
  }, []);

  return { virtualDriveStatus };
}
