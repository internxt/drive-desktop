import { useEffect, useState } from 'react';
import PlayButton from '../../assets/play.svg';
import StopButton from '../../assets/stop.svg';
import Spinner from '../../assets/spinner.svg';
import useSyncStatus from '../../hooks/SyncStatus';
import useSyncStopped from '../../hooks/SyncStopped';
import { SyncStatus } from '../../../main/background-processes/sync';

export default function SyncAction() {
  const [state, setState] = useState<SyncStatus | 'LOADING'>('STANDBY');

  const [showUpdatedJustNow, setShowUpdatedJustNow] = useState(false);

  useSyncStatus(setState);

  const [syncStoppedReason] = useSyncStopped();

  useEffect(() => {
    if (state === 'STANDBY' && syncStoppedReason?.reason === 'EXIT') {
      setShowUpdatedJustNow(true);
      const timeout = setTimeout(() => setShowUpdatedJustNow(false), 1000 * 10);
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }
  }, [state]);

  const Button =
    state === 'STANDBY'
      ? PlayButton
      : state === 'RUNNING'
      ? StopButton
      : Spinner;

  function onClick() {
    setState('LOADING');

    if (state === 'STANDBY') window.electron.startSyncProcess();
    else window.electron.stopSyncProcess();
  }

  return (
    <div className="flex items-center justify-between border-t border-t-l-neutral-30 bg-white px-3 py-1">
      <p className="text-xs text-neutral-500">
        {state === 'RUNNING'
          ? 'Syncing your files'
          : showUpdatedJustNow
          ? 'Updated just now'
          : ''}
      </p>
      <Button
        tabIndex={0}
        onClick={() => state !== 'LOADING' && onClick()}
        onKeyPress={() => state !== 'LOADING' && onClick()}
        className={`h-7 w-7 rounded fill-blue-60 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-offset-blue-60 ${
          state !== 'LOADING' ? 'cursor-pointer' : 'animate-spin'
        }`}
      />
    </div>
  );
}
