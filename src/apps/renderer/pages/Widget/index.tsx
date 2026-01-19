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
import { ISSUES, SETTINGS, useGetWorkArea } from './use-get-work-area';
import { useIssuesStore } from '../Issues/issues-store';
import { IssuesPage } from '../Issues';

export function Widget() {
  const { activeSection: settingsSection } = useSettingsStore();
  const { activeSection: issuesSection } = useIssuesStore();
  const { syncStatus } = useSyncStatus();
  const { settings, issues } = useGetWorkArea();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      void globalThis.window.electron.hideFrontend();
    }
  }

  return (
    <div className="relative h-screen w-screen bg-transparent" onMouseDown={onMouseDown}>
      {settingsSection && (
        <Draggable handle=".draggable-handle" defaultPosition={settings?.positions} bounds={settings?.bounds} defaultClassName="absolute">
          <div className="rounded-shadow-white" style={{ width: SETTINGS.width }}>
            <Settings activeSection={settingsSection} />
          </div>
        </Draggable>
      )}

      {issuesSection && (
        <Draggable handle=".draggable-handle" defaultPosition={issues?.positions} bounds={issues?.bounds} defaultClassName="absolute">
          <div className="rounded-shadow-white" style={{ width: ISSUES.width }}>
            <IssuesPage activeSection={issuesSection} />
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
