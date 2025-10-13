import Header from './Header';
import SyncAction from './SyncAction';
import SyncInfo from './SyncInfo';
import useSyncStatus from '../../hooks/useSyncStatus';
import { SyncFailed } from './SyncFailed';
import ModalLogout from './Logout';
import { useState } from 'react';
import { InfoBanners } from './InfoBanners/InfoBanners';

export default function Widget() {
  const { syncStatus } = useSyncStatus();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  const handleRetrySync = () => {
    window.electron.syncManually().catch((err) => {
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
      <Header setIsLogoutModalOpen={setIsLogoutModalOpen} />
      <InfoBanners />
      {displayErrorInWidget ? renderWidgetError() : <SyncInfo />}
      <SyncAction syncStatus={syncStatus} />
      {isLogoutModalOpen && (
        <ModalLogout
          onClose={() => setIsLogoutModalOpen(false)}
          onLogout={() => {
            setIsLogoutModalOpen(false);
            window.electron.logout();
          }}
        />
      )}
    </div>
  );
}
