import BackupsFatalErrorBanner from './BackupsErrorBanner';
import Header from './Header';
import SyncAction from './SyncAction';
import SyncErrorBanner from './SyncErrorBanner';
import SyncInfo from './SyncInfo';
import useSyncStatus from '../../hooks/SyncStatus';
import { useState } from 'react';
import { SyncStatus } from '../../../main/background-processes/sync';
import { SyncFailed } from './SyncFailed';

export default function Widget() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('RUNNING');
  useSyncStatus(setSyncStatus);
  const handleRetrySync = () => {
    window.electron.startRemoteSync().catch((err) => {
      reportError(err);
    });
  };
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <SyncErrorBanner />
      <BackupsFatalErrorBanner />
      {syncStatus === 'FAILED' ? (
        <SyncFailed onRetrySync={handleRetrySync} />
      ) : (
        <SyncInfo />
      )}
      <SyncAction syncStatus={syncStatus} />
    </div>
  );
}
