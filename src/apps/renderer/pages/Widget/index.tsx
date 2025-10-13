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

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header setIsLogoutModalOpen={setIsLogoutModalOpen} />
      <InfoBanners />

      {syncStatus === 'SYNC_FAILED' ? <SyncFailed /> : <SyncInfo />}

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
