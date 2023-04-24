import Warn from '../../assets/warn.svg';
import Error from '../../assets/error.svg';
import SyncFatalErrorMessages from '../../messages/process-fatal-error';
import useSyncStatus from '../../hooks/SyncStatus';
import useSyncStopped from '../../hooks/SyncStopped';
import { SyncStatus } from '../../../main/background-processes/sync';
import { ProcessFatalErrorName } from '../../../workers/types';

const fatalErrorActionMap: Record<
  ProcessFatalErrorName,
  { name: string; func: () => void } | undefined
> = {
  BASE_DIRECTORY_DOES_NOT_EXIST: {
    name: 'Select folder',
    func: async () => {
      const result = await window.electron.chooseSyncRootWithDialog();
      if (result) window.electron.startSyncProcess();
    },
  },
  INSUFICIENT_PERMISION_ACCESSING_BASE_DIRECTORY: {
    name: 'Change folder',
    func: async () => {
      const result = await window.electron.chooseSyncRootWithDialog();
      if (result) window.electron.startSyncProcess();
    },
  },
  NO_INTERNET: undefined,
  NO_REMOTE_CONNECTION: undefined,
  CANNOT_ACCESS_BASE_DIRECTORY: undefined,
  CANNOT_ACCESS_TMP_DIRECTORY: undefined,
  CANNOT_GET_CURRENT_LISTINGS: undefined,
  UNKNOWN: undefined,
};

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

  if (stopReason?.reason === 'COULD_NOT_ACQUIRE_LOCK') {

  }
  else if (stopReason?.reason === 'FATAL_ERROR')
    message = SyncFatalErrorMessages[stopReason.errorName];

  let action;

  if (stopReason?.reason === 'FATAL_ERROR') {
    action = fatalErrorActionMap[stopReason.errorName];
  }

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
      {action && (
        <span
          onClick={action.func}
          role="button"
          tabIndex={0}
          onKeyDown={action.func}
          className="ml-2 cursor-pointer text-sm text-blue-60 underline"
        >
          {action.name}
        </span>
      )}
    </div>
  ) : (
    <div />
  );
}
