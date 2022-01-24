import { useEffect, useState } from 'react';
import { SyncStatus } from '../../../main/main';
import PlayButton from '../../assets/play.svg';
import StopButton from '../../assets/stop.svg';
import Spinner from '../../assets/spinner.svg';
import useSyncStatus from '../../hooks/SyncStatus';
import useSyncStopped from '../../hooks/SyncStopped';

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
    <div className="bg-white px-3 py-1 border-t border-t-l-neutral-30 flex items-center justify-between">
      <p className="text-xs text-neutral-500">
        {state === 'RUNNING'
          ? 'Synchronising your files'
          : showUpdatedJustNow
          ? 'Updated just now'
          : ''}
      </p>
      <Button
        tabIndex={0}
        onClick={() => state !== 'LOADING' && onClick()}
        onKeyPress={() => state !== 'LOADING' && onClick()}
        className={`h-7 w-7 fill-blue-60 ${
          state !== 'LOADING' ? 'cursor-pointer' : 'animate-spin'
        }`}
      />
    </div>
  );
}
