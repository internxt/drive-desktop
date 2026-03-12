import Header from './Header';
import SyncAction from './SyncAction';
import { SyncInfo } from './SyncInfo';
import useSyncStatus from '../../hooks/useSyncStatus';
import { SyncFailed } from './SyncFailed';
import { ModalLogout } from './Logout';
import { useState } from 'react';
import { User } from '@/apps/main/types';

export function Widget({ user }: { user: User }) {
  const { syncStatus } = useSyncStatus();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  return (
    <div
      data-automation-id="widget-rootView"
      className="rounded-shadow-white absolute bottom-0 right-12 flex h-[392px] w-[330px] flex-col bg-surface dark:bg-gray-1">
      <Header user={user} setIsLogoutModalOpen={setIsLogoutModalOpen} />

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
