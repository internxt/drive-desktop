import BackupsFatalErrorBanner from './BackupsErrorBanner';
import Header from './Header';
import SyncAction from './SyncAction';
import SyncErrorBanner from './SyncErrorBanner';
import SyncInfo from './SyncInfo';
import useSyncStatus from '../../hooks/SyncStatus';
import { useState } from 'react';
import { SyncStatus } from '../../../main/background-processes/sync';
import { SyncFailed } from './SyncFailed';
import useVirtualDriveStatus from 'renderer/hooks/VirtualDriveStatus';
import { VirtualDriveError } from './VirtualDriveError';

export default function Widget() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('RUNNING');
  useSyncStatus(setSyncStatus);
  const { status: virtualDriveStatus } = useVirtualDriveStatus();
  const handleRetrySync = () => {
    window.electron.startRemoteSync().catch((err) => {
      reportError(err);
    });
  };

  const handleRetryMountVirtualDrive = () => {
    window.electron.retryVirtualDriveMount();
  };

  const displayErrorInWidget =
    (virtualDriveStatus && virtualDriveStatus === 'FAILED_TO_MOUNT') ||
    (syncStatus && syncStatus === 'FAILED');
  const renderWidgetError = () => {
    if (
      virtualDriveStatus === 'FAILED_TO_MOUNT' ||
      virtualDriveStatus === 'MOUNTING'
    ) {
      return (
        <VirtualDriveError
          status={virtualDriveStatus}
          onRetryVirtualDriveMount={handleRetryMountVirtualDrive}
        />
      );
    }

    if (syncStatus === 'FAILED') {
      return <SyncFailed onRetrySync={handleRetrySync} />;
    }
    return <></>;
  };
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <SyncErrorBanner />
      <BackupsFatalErrorBanner />
      {displayErrorInWidget ? renderWidgetError() : <SyncInfo />}
      <SyncAction syncStatus={syncStatus} />
    </div>
  );
}
