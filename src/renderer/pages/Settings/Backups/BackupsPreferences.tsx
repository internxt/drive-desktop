import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useEffect, useState } from 'react';
import { BackupProgress } from '../../../../main/background-processes/backups';
import Button from '../../../components/Button';
import Select, { SelectOptionsType } from 'renderer/components/Select';
import Checkbox from '../../../components/Checkbox';
import { useTranslationContext } from '../../../context/LocalContext';
import useBackupStatus from '../../../hooks/BackupStatus';
import { getPercentualProgress } from '../../../utils/backups-progress';
import useBackupFatalErrors from '../../../hooks/BackupFatalErrors';
import { WarningCircle } from '@phosphor-icons/react';

dayjs.extend(relativeTime);

interface BackupsIntervalType extends SelectOptionsType {
  interval: number;
}

type BackupIntervalType = '6h' | '12h' | '24h' | 'manual';

export interface BackupsPreferencesProps {
  showFolderList: () => void;
}

export default function BackupsPreferences({
  showFolderList,
}: BackupsPreferencesProps) {
  const { translate } = useTranslationContext();
  const backupStatus = useBackupStatus();

  const DEFAULT_INTERVAL = '24h';
  const [backupsInterval, setBackupsInterval] =
    useState<BackupIntervalType | null>(null);
  const [backupsEnabled, setBackupsEnabled] = useState(false);
  const [lastBackupTimestamp, setLastBackupTimestamp] = useState(-1);
  const [backupProgress, setBackupProgress] = useState<null | BackupProgress>(
    null
  );

  const { thereAreErrors } = useBackupFatalErrors();

  const BackupsIntervals: BackupsIntervalType[] = [
    {
      value: '6h',
      name: translate('settings.backups.frequency.options.6h'),
      interval: 21_600_000,
    },
    {
      value: '12h',
      name: translate('settings.backups.frequency.options.12h'),
      interval: 43_200_000,
    },
    {
      value: '24h',
      name: translate('settings.backups.frequency.options.24h'),
      interval: 86_400_000,
    },
    {
      value: 'manual',
      name: translate('settings.backups.frequency.options.manually'),
      interval: -1,
    },
  ];

  const getIntervalValue = (interval: number): BackupIntervalType =>
    (BackupsIntervals.find((option) => option.interval === interval)
      ?.value as BackupIntervalType) ?? DEFAULT_INTERVAL;

  function refreshBackupsInterval() {
    window.electron
      .getBackupsInterval()
      .then((interval) => setBackupsInterval(getIntervalValue(interval)));
  }

  function refreshBackupsEnabled() {
    window.electron.getBackupsEnabled().then(setBackupsEnabled);
  }

  function refreshLastBackupTimestamp() {
    window.electron.getLastBackupTimestamp().then(setLastBackupTimestamp);
  }

  useEffect(() => {
    if (backupStatus === 'STANDBY') {
      setBackupProgress(null);
    }
  }, [backupStatus]);

  useEffect(() => {
    refreshBackupsInterval();
    refreshBackupsEnabled();
  }, []);

  useEffect(() => {
    const removeListener = window.electron.onBackupProgress(setBackupProgress);
    return removeListener;
  }, []);

  useEffect(refreshLastBackupTimestamp, [backupStatus]);

  async function onBackupsIntervalChanged(value: string) {
    const interval = BackupsIntervals.filter(
      (option) => option.value === value
    )[0].interval;

    await window.electron.setBackupsInterval(interval);
    refreshBackupsInterval();
  }

  async function onBackupsEnabledClicked() {
    await window.electron.toggleBackupsEnabled();
    refreshBackupsEnabled();
  }

  const progressDisplay = backupProgress
    ? `(${getPercentualProgress(backupProgress).toFixed(0)}%)`
    : '(...)';

  const handleOpenURL = async (URL: string) => {
    try {
      await window.electron.openUrl(URL);
    } catch (error) {
      reportError(error);
    }
  };

  return (
    <div className="flex flex-col space-y-5">
      <Checkbox
        checked={backupsEnabled}
        label={translate('settings.backups.activate')}
        onClick={onBackupsEnabledClicked}
      />

      {thereAreErrors() && (
        <section className="relative z-0 flex items-center space-x-2 overflow-hidden rounded-lg border border-red bg-surface p-3 font-normal text-red shadow-sm ring-3 ring-red/10 before:absolute before:inset-0 before:-z-1 before:bg-red/5 dark:ring-red/35 dark:before:bg-red/10">
          <div className="relative z-0 flex w-6 items-center justify-center text-red before:absolute before:-z-1 before:h-3 before:w-3 before:bg-white">
            <WarningCircle size={24} weight="fill" />
          </div>
          <span
            className="flex-1 truncate"
            title={translate('settings.backups.last-backup-had-issues')}
          >
            {translate('settings.backups.last-backup-had-issues')}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.electron.openProcessIssuesWindow()}
            customClassName="ml-auto"
          >
            {translate('settings.backups.see-issues')}
          </Button>
        </section>
      )}

      <div className="flex flex-col space-y-1.5">
        <div className="flex items-center space-x-2">
          <Button
            variant={backupStatus === 'STANDBY' ? 'primary' : 'danger'}
            disabled={!backupsEnabled}
            onClick={
              backupStatus === 'STANDBY'
                ? window.electron.startBackupsProcess
                : window.electron.stopBackupsProcess
            }
          >
            {backupStatus === 'STANDBY'
              ? translate('settings.backups.action.start')
              : translate('settings.backups.action.stop')}
          </Button>

          <Button
            variant="secondary"
            disabled={!backupsEnabled || backupStatus === 'RUNNING'}
            onClick={showFolderList}
          >
            {translate('settings.backups.select-folders')}
          </Button>
        </div>

        <div className="flex h-5 items-center justify-start text-sm text-gray-60">
          {backupStatus === 'STANDBY'
            ? lastBackupTimestamp !== -1
              ? `${translate('settings.backups.action.last-run')} ${dayjs(
                  lastBackupTimestamp
                ).fromNow()}`
              : ''
            : translate('settings.backups.action.running', {
                progress: progressDisplay,
              })}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex flex-1 flex-col items-start space-y-2">
          <p
            className={`text-sm font-medium leading-4 ${
              backupsEnabled ? 'text-gray-80' : 'text-gray-40'
            }`}
          >
            {translate('settings.backups.frequency.title')}
          </p>

          {backupsInterval && (
            <Select
              disabled={!backupsEnabled}
              options={BackupsIntervals}
              value={backupsInterval}
              onValueChange={onBackupsIntervalChanged}
            />
          )}
        </div>

        <Button
          variant="secondary"
          onClick={() =>
            handleOpenURL('https://drive.internxt.com/app/backups')
          }
        >
          {translate('settings.backups.view-backups')}
        </Button>
      </div>
    </div>
  );
}
