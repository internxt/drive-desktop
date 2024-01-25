import { useEffect, useState } from 'react';
import { reportError } from '../utils/errors';
import { VirtualDriveStatus } from '../../shared/types/VirtualDriveStatus';

export default function useVirtualDriveStatus() {
  const [virtualDriveStatus, setVirtualDriveStatus] =
    useState<VirtualDriveStatus>();

  useEffect(() => {
    window.electron
      .getVirtualDriveRoot()
      .then(() => setVirtualDriveStatus(VirtualDriveStatus.READY))
      .catch((err) => {
        reportError(err);
      });
  }, []);

  function virtualDriveCanBeOpened() {
    return virtualDriveStatus !== VirtualDriveStatus.NOT_FOUND;
  }

  return { virtualDriveStatus, virtualDriveCanBeOpened };
}
