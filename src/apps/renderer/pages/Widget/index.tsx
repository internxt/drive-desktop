import { isClientVersionUnsupported } from '@internxt/drive-desktop-core/build/backend/features/client-compatibility/services/is-client-version-unsupported';
import { ClientCompatibilityBanner } from '@internxt/drive-desktop-core/build/frontend';
import { useState } from 'react';
import { User } from '@/apps/main/types';
import { useClientCompatibility } from '../../hooks/use-client-compatibility';
import useSyncStatus from '../../hooks/useSyncStatus';
import { useI18n } from '../../localize/use-i18n';
import Header from './Header';
import { ModalLogout } from './Logout';
import SyncAction from './SyncAction';
import { SyncFailed } from './SyncFailed';
import { SyncInfo } from './SyncInfo';

export function Widget({ user }: { user: User }) {
  const { syncStatus } = useSyncStatus();
  const { language } = useI18n();
  const clientCompatibility = useClientCompatibility();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const banner = (
    <ClientCompatibilityBanner
      state={clientCompatibility.state}
      language={language}
      onUpdate={() => void globalThis.window.electron.updateApp()}
    />
  );

  /**
   * v2.7.2 Alexis Mora
   * An unsupported version only shows the update banner: the header dropdown is the way into preferences,
   * antivirus and cleaner, which must not run until the user updates.
   */
  if (isClientVersionUnsupported(clientCompatibility.state)) {
    return (
      <div
        data-automation-id="widget-rootView"
        className="rounded-shadow-white absolute bottom-0 right-12 flex h-[392px] w-[330px] flex-col justify-center bg-surface dark:bg-gray-1">
        {banner}
      </div>
    );
  }

  return (
    <div
      data-automation-id="widget-rootView"
      className="rounded-shadow-white absolute bottom-0 right-12 flex h-[392px] w-[330px] flex-col bg-surface dark:bg-gray-1">
      <Header user={user} setIsLogoutModalOpen={setIsLogoutModalOpen} isSyncing={syncStatus === 'SYNCING'} />

      {banner}

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
