import Header from './Header';
import SyncAction from './SyncAction';
import { SyncInfo } from './SyncInfo';
import useSyncStatus from '../../hooks/useSyncStatus';
import { SyncFailed } from './SyncFailed';
import ModalLogout from './Logout';
import { useState } from 'react';
import Settings from '../Settings';
import { useSettingsStore } from '../Settings/settings-store';
import Draggable from 'react-draggable';
import { SETTINGS, useGetWorkArea } from './use-get-work-area';

export function Widget() {
  const { activeSection: settingsSection } = useSettingsStore();
  const { syncStatus } = useSyncStatus();
  const { settings } = useGetWorkArea();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      void globalThis.window.electron.hideFrontend();
    }
  }

  return (
    <div className="relative h-screen w-screen bg-transparent" onMouseDown={onMouseDown}>
      {settingsSection && (
        <Draggable handle=".draggable-handle" defaultPosition={settings?.positions} bounds={settings?.bounds}>
          <div className="rounded-shadow-white" style={{ width: SETTINGS.width, height: SETTINGS.height }}>
            <Settings activeSection={settingsSection} />
          </div>
        </Draggable>
      )}

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
    </div>
  );
}
