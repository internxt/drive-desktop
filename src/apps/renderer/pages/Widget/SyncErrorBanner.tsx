import { SyncStatus } from '../../../../context/desktop/sync/domain/SyncStatus';
import { FatalError } from '../../../../shared/issues/FatalError';
import Error from '../../assets/error.svg';
import Warn from '../../assets/warn.svg';
import { useTranslationContext } from '../../context/LocalContext';
import useSyncStatus from '../../hooks/useSyncStatus';
import useSyncStopped from '../../hooks/useSyncStopped';
import SyncFatalErrorMessages from '../../messages/fatal-error';

type ErrorSeverity = 'FATAL' | 'WARN';

const fatalErrorActionMap: Record<
  FatalError,
  { name: string; func: () => void } | undefined
> = {
  BASE_DIRECTORY_DOES_NOT_EXIST: {
    name: 'Select folder',
    func: async () => {
      const result = await window.electron.chooseSyncRootWithDialog();
      if (result) {
        window.electron.startSyncProcess();
      }
    },
  },
  INSUFFICIENT_PERMISSION_ACCESSING_BASE_DIRECTORY: {
    name: 'Change folder',
    func: async () => {
      const result = await window.electron.chooseSyncRootWithDialog();
      if (result) {
        window.electron.startSyncProcess();
      }
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
  const { translate } = useTranslationContext();

  function onSyncStatusChanged(value: SyncStatus) {
    if (value === 'RUNNING') {
      setStopReason(null);
    }
  }

  useSyncStatus(onSyncStatusChanged);

  const severity = 'FATAL' as ErrorSeverity;
  const show = stopReason !== null && stopReason?.reason !== 'STOPPED_BY_USER';

  const Icon = severity === 'FATAL' ? Error : Warn;

  let message = '';

  if (stopReason?.reason === 'FATAL_ERROR') {
    message = SyncFatalErrorMessages[stopReason.errorName];
  }

  let action;

  if (stopReason?.reason === 'FATAL_ERROR') {
    action = fatalErrorActionMap[stopReason.errorName];
  }

  return show ? (
    <div
      className={`flex items-center px-3 py-2 text-xs ${
        severity === 'WARN' ? 'bg-yellow/10 text-yellow' : 'bg-red/10 text-red'
      }`}
    >
      <Icon className="h-5 w-5" />
      <p className="mb-0 ml-2">{translate(message)}</p>
      {action && (
        <span
          onClick={action.func}
          role="button"
          tabIndex={0}
          onKeyDown={action.func}
          className="ml-2 cursor-pointer text-sm text-primary underline"
        >
          {action.name}
        </span>
      )}
    </div>
  ) : (
    <div />
  );
}
