import { useEffect, useState } from 'react';

import { SyncStatus } from '../../../main/background-processes/sync';
import { useTranslationContext } from '../../context/LocalContext';
import useSyncStatus from '../../hooks/SyncStatus';
import useSyncStopped from '../../hooks/SyncStopped';

export default function SyncAction() {
  const { translate } = useTranslationContext();

  const [state, setState] = useState<SyncStatus | 'LOADING'>('STANDBY');

  const [showLockError, setShowLockError] = useState(false);
  const [isOnLine, setIsOnLine] = useState(true);

  useSyncStatus(setState);

  const [syncStoppedReason] = useSyncStopped();

  useEffect(() => {
    setIsOnLine(navigator.onLine);
  });

  useEffect(() => {
    if (
      state === 'STANDBY' &&
      syncStoppedReason?.reason === 'COULD_NOT_ACQUIRE_LOCK'
    ) {
      setShowLockError(true);
      const timeout = setTimeout(() => setShowLockError(false), 1000 * 10);

      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }
  }, [state]);

  return (
    <div className="flex items-center justify-between border-t border-t-l-neutral-30 bg-white px-3 py-1">
      <p className="text-xs text-neutral-500">
        {state === 'RUNNING' &&
          isOnLine &&
          translate('widget.footer.action-description.syncing')}
        {state === 'STANDBY' &&
          isOnLine &&
          translate('widget.footer.action-description.updated')}
        {state === 'STANDBY' &&
          showLockError &&
          isOnLine &&
          translate('widget.footer.errors.lock')}
        {!isOnLine && translate('widget.footer.errors.offline')}
      </p>
    </div>
  );
}
