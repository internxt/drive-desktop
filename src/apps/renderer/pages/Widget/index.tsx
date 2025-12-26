import Header from './Header';
import SyncAction from './SyncAction';
import { SyncInfo } from './SyncInfo';
import useSyncStatus from '../../hooks/useSyncStatus';
import { SyncFailed } from './SyncFailed';
import ModalLogout from './Logout';
import { useState } from 'react';

export function Widget() {
  const { syncStatus } = useSyncStatus();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header setIsLogoutModalOpen={setIsLogoutModalOpen} />

      {syncStatus === 'SYNC_FAILED' ? <SyncFailed /> : <SyncInfo />}

      <SyncAction syncStatus={syncStatus} />

      {isLogoutModalOpen && (
        <ModalLogout
          onClose={() => setIsLogoutModalOpen(false)}
          onLogout={() => {
            setIsLogoutModalOpen(false);
            globalThis.window.electron.logout();
          }}
        />
      )}
    </div>
  );
}
