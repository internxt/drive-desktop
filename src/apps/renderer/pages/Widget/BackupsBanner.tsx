import { AnimatePresence, motion } from 'framer-motion';
import { useContext, useEffect, useState } from 'react';

import {
  BackupExitReason,
  BackupProgress,
} from '../../../main/background-processes/backups';
import Error from '../../assets/error.svg';
import Success from '../../assets/success.svg';
import Warn from '../../assets/warn.svg';
import useBackupFatalErrors from '../../hooks/BackupFatalErrors';
import useBackupStatus from '../../hooks/BackupStatus';
import useProcessIssues from '../../hooks/ProcessIssues';
import { getPercentualProgress } from '../../utils/backups-progress';
import { ClockCounterClockwise, X } from '@phosphor-icons/react';
import { DeviceContext } from 'renderer/context/DeviceContext';

export function BackupsBanner({
  className = '',
  onVisibilityChanged,
}: {
  className?: string;
  onVisibilityChanged: (value: boolean) => void;
}) {
  const [deviceState] = useContext(DeviceContext);
  const status = useBackupStatus();
  const { backupFatalErrors } = useBackupFatalErrors();
  const issues = useProcessIssues().filter(
    (issue) => issue.process === 'BACKUPS'
  );

  const [backupProgress, setBackupProgress] = useState<null | BackupProgress>(
    null
  );

  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(false);
  }, [status]);

  const [lastExit, setLastExit] = useState<null | BackupExitReason>(null);

  useEffect(() => {
    const removeListener = window.electron.onBackupProgress(setBackupProgress);

    return removeListener;
  }, []);

  useEffect(() => {
    window.electron.getLastBackupExitReason().then(setLastExit);
  }, [status]);

  let body = '';
  let percentage = '';
  let action = '';

  if (status === 'RUNNING' && backupProgress) {
    body =
      backupProgress.totalFolders > 1
        ? `Backed up ${backupProgress.currentFolder - 1} out of ${
            backupProgress.totalFolders
          } folders`
        : 'Backing up your folder';

    const percentualProgress = getPercentualProgress(backupProgress);

    percentage = `${percentualProgress.toFixed(0)}%`;
  } else if (backupFatalErrors.length) {
    body = 'At least one of your backups failed';
    action = 'See more';
  } else if (issues.length) {
    body = 'Backup completed with issues';
    action = 'See more';
  } else if (lastExit === 'FORCED_BY_USER') {
    body = 'Backup stopped';
    action = 'Start again';
  } else if (backupProgress) {
    body =
      backupProgress.totalFolders > 1
        ? `Backed up ${backupProgress.totalFolders} folders`
        : 'Backed up your folder';
  }

  let iconVariant: 'SUCCESS' | 'WARNING' | 'ERROR' | undefined;

  if (
    status === 'STANDBY' &&
    issues.length === 0 &&
    backupFatalErrors.length === 0 &&
    lastExit === 'PROCESS_FINISHED'
  ) {
    iconVariant = 'SUCCESS';
  } else if (backupFatalErrors.length) {
    iconVariant = 'ERROR';
  } else if (issues.length) {
    iconVariant = 'WARNING';
  }

  const show = (status !== 'STANDBY' || backupProgress) && !hidden;

  useEffect(() => {
    onVisibilityChanged(show as boolean);
  }, [status, backupProgress, hidden]);

  function onClick() {
    if (issues.length || backupFatalErrors.length) {
      window.electron.openProcessIssuesWindow();
    } else if (lastExit === 'FORCED_BY_USER') {
      window.electron.startBackupsProcess();
    } else {
      window.electron.openSettingsWindow('BACKUPS');
    }

    if (status !== 'RUNNING') {
      setHidden(true);
    }
  }

  const BackupsIcon = ({
    variant,
  }: {
    variant?: 'SUCCESS' | 'WARNING' | 'ERROR';
  }) => {
    return (
      <div className="relative">
        <ClockCounterClockwise
          size={28}
          weight="light"
          className="text-gray-100"
        />
        {variant === 'SUCCESS' && (
          <>
            <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-white" />
            <Success className="absolute bottom-0 right-0 h-3.5 w-3.5" />
          </>
        )}
        {variant === 'WARNING' && (
          <Warn className="absolute bottom-0 right-0 h-3.5 w-3.5" />
        )}
        {variant === 'ERROR' && (
          <Error className="absolute bottom-0 right-0 h-3.5 w-3.5" />
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className={`group/backupsBanner relative flex px-3 pt-3 ${className}`}
          role="none"
          onClick={onClick}
        >
          <div className="flex h-16 flex-1 items-center space-x-2.5 truncate rounded-lg border border-gray-10 bg-gray-1 px-3 shadow-sm dark:bg-gray-5">
            <BackupsIcon variant={iconVariant} />

            <div className="flex flex-1 flex-col -space-y-0.5 truncate">
              <div className="flex h-5 max-h-5 min-h-[20px] flex-1 items-start space-x-4 truncate">
                <h1 className="flex-1 truncate text-sm font-medium leading-4 text-gray-100">
                  {deviceState.status === 'SUCCESS'
                    ? deviceState.device.name
                    : 'Backup'}
                </h1>

                <X
                  onClick={(e) => {
                    e.stopPropagation();
                    setHidden(true);
                  }}
                  size={20}
                  className={`hidden shrink-0 cursor-pointer text-gray-60 hover:text-gray-80 active:text-gray-60 ${
                    status === 'STANDBY' ? 'group-hover/backupsBanner:flex' : ''
                  }`}
                />
              </div>

              <p className="truncate text-xs font-medium text-gray-60">
                {body}
                <span className="ml-1">{percentage}</span>
                <span className="ml-1 text-primary">{action}</span>
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
