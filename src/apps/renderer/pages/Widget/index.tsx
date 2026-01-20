import Header from './Header';
import SyncAction from './SyncAction';
import { SyncInfo } from './SyncInfo';
import useSyncStatus from '../../hooks/useSyncStatus';
import { SyncFailed } from './SyncFailed';
import { ModalLogout } from './Logout';
import { useState } from 'react';

export function Widget() {
  const { syncStatus } = useSyncStatus();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  return (
    <div className="rounded-shadow-white absolute bottom-0 right-16 flex h-[392px] w-[330px] flex-col bg-surface dark:bg-gray-1">
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
