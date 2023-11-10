import BackupsFatalErrorBanner from './BackupsErrorBanner';
import Header from './Header';
import SyncAction from './SyncAction';
import SyncErrorBanner from './SyncErrorBanner';
import SyncInfo from './SyncInfo';
import useSyncStatus from '../../hooks/useSyncStatus';
import { SyncFailed } from './SyncFailed';

export default function Widget() {
  const { syncStatus } = useSyncStatus();

  const handleRetrySync = () => {
    window.electron.startRemoteSync().catch((err) => {
      reportError(err);
    });
  };

  const displayErrorInWidget = syncStatus && syncStatus === 'FAILED';

  const renderWidgetError = () => {
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
