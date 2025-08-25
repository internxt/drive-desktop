// ModalLogout.tsx
import React, { useEffect, useState } from 'react';
import { useTranslationContext } from '../../context/LocalContext';
import useSyncStatus from '../../hooks/useSyncStatus';

interface ModalLogoutProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const ModalLogout: React.FC<ModalLogoutProps> = ({ isOpen, onClose, onLogout }) => {
  if (!isOpen) return null;

  const { translate } = useTranslationContext();

  const { syncStatus } = useSyncStatus();

  const [isSyncPending, setIsSyncPending] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    //TODO: Implement checkSyncPending function to check if sync is pending
    const checkSyncPending = async (): Promise<boolean> => {
      const syncPending = syncStatus === 'RUNNING';
      const wasSyncing = await window.electron.getRecentlywasSyncing();

      const existFileUnsync = await window.electron.getUnsycFileInSyncEngine();

      return syncPending || wasSyncing || existFileUnsync.length > 0;
    };

    checkSyncPending().then((value) => {
      setIsSyncPending(value);
    });
  }, [syncStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const forceSync = () => {
    window.electron.syncManually().then(() => {
      onClose();
    });
  };

  if (!isReady) return null;

  return (
    <div className="fixed inset-0 z-50 flex h-full w-screen overflow-auto bg-gray-20 bg-opacity-50" onClick={onClose}>
      <div
        className="z-100 relative m-auto flex w-11/12 max-w-md flex-col rounded-lg bg-white p-4 shadow-lg dark:bg-surface"
        onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg leading-3 text-gray-80">
          {isSyncPending
            ? translate('widget.header.dropdown.logout-confirmation.sync-pending.title')
            : translate('widget.header.dropdown.logout-confirmation.no-sync-pending.title')}
        </h2>
        <p className="my-3 text-supporting-3 leading-5 text-gray-70">
          {isSyncPending
            ? translate('widget.header.dropdown.logout-confirmation.sync-pending.message')
            : translate('widget.header.dropdown.logout-confirmation.no-sync-pending.message')}
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={isSyncPending ? forceSync : onClose}
            className="bg-gray-300 hover:bg-gray-400 rounded-6px border border-gray-30 bg-white px-5 py-1 text-supporting-3 text-black dark:border-gray-10 dark:bg-gray-5 dark:text-gray-80">
            {isSyncPending
              ? translate('widget.header.dropdown.logout-confirmation.sync-pending.cancel')
              : translate('widget.header.dropdown.logout-confirmation.no-sync-pending.cancel')}
          </button>
          <button onClick={onLogout} className="bg-red-600 rounded-6px bg-red px-5 py-1 text-supporting-3 text-white">
            {isSyncPending
              ? translate('widget.header.dropdown.logout-confirmation.sync-pending.confirm')
              : translate('widget.header.dropdown.logout-confirmation.no-sync-pending.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalLogout;
