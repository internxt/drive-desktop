import { useEffect, useState } from 'react';
import Warn from '../../assets/warn.svg';
import Error from '../../assets/error.svg';
import { SyncStatus, SyncStoppedPayload } from '../../../main/main';
import FatalErrorMessages from '../../messages/sync-fatal-error';

export default function SyncErrorBanner() {
  const [stopReason, setStopReason] = useState<SyncStoppedPayload | null>(null);

  useEffect(() => {
    const removeListener = window.electron.onSyncStopped(setStopReason);
    return removeListener;
  }, []);

  function onSyncStatusChanged(value: SyncStatus) {
    if (value === 'RUNNING') setStopReason(null);
  }

  useEffect(() => {
    const removeListener =
      window.electron.onSyncStatusChanged(onSyncStatusChanged);
    return removeListener;
  }, []);

  const severity =
    stopReason?.reason === 'COULD_NOT_ACQUIRE_LOCK' ? 'WARN' : 'FATAL';
  const show =
    stopReason !== null &&
    stopReason?.reason !== 'EXIT' &&
    stopReason?.reason !== 'STOPPED_BY_USER';

  const Icon = severity === 'FATAL' ? Error : Warn;

  let message = '';

  if (stopReason?.reason === 'COULD_NOT_ACQUIRE_LOCK')
    message =
      "Looks like other of your devices is already syncing, we'll try again later";
  else if (stopReason?.reason === 'FATAL_ERROR')
    message = FatalErrorMessages[stopReason.errorName];

  return show ? (
    <div
      className={`px-3 py-2 flex items-center text-xs ${
        severity === 'WARN'
          ? 'bg-yellow-10 text-yellow-60'
          : 'bg-red-10 text-red-60'
      }`}
    >
      <Icon className="w-5 h-5" />
      <p className="ml-2 mb-0">{message}</p>
    </div>
  ) : (
    <div />
  );
}
