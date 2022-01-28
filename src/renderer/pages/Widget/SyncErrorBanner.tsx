import Warn from '../../assets/warn.svg';
import Error from '../../assets/error.svg';
import FatalErrorMessages from '../../messages/process-fatal-error';
import useSyncStatus from '../../hooks/SyncStatus';
import useSyncStopped from '../../hooks/SyncStopped';
import { SyncStatus } from '../../../main/background-processes/sync';

export default function SyncErrorBanner() {
  const [stopReason, setStopReason] = useSyncStopped();

  function onSyncStatusChanged(value: SyncStatus) {
    if (value === 'RUNNING') setStopReason(null);
  }

  useSyncStatus(onSyncStatusChanged);

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
      className={`flex items-center px-3 py-2 text-xs ${
        severity === 'WARN'
          ? 'bg-yellow-10 text-yellow-60'
          : 'bg-red-10 text-red-60'
      }`}
    >
      <Icon className="h-5 w-5" />
      <p className="ml-2 mb-0">{message}</p>
    </div>
  ) : (
    <div />
  );
}
