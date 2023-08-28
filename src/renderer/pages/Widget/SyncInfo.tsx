import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode, useContext, useEffect, useState } from 'react';

import {
  BackupExitReason,
  BackupProgress,
} from '../../../main/background-processes/backups';
import { SyncStatus } from '../../../main/background-processes/sync';
import {
  ProcessErrorName,
  ProcessInfoUpdatePayload,
} from '../../../workers/types';
import Error from '../../assets/error.svg';
import syncedStackLight from '../../assets/illustrations/syncedStack-light.png';
import syncedStackDark from '../../assets/illustrations/syncedStack-dark.png';
import Success from '../../assets/success.svg';
import Warn from '../../assets/warn.svg';
import { Operation } from '../../components/FileWithOperation';
import { useTranslationContext } from '../../context/LocalContext';
import useBackupFatalErrors from '../../hooks/BackupFatalErrors';
import useBackupStatus from '../../hooks/BackupStatus';
import useProcessIssues from '../../hooks/ProcessIssues';
import useSyncStatus from '../../hooks/SyncStatus';
import useSyncStopped from '../../hooks/SyncStopped';
import { shortMessages } from '../../messages/process-error';
import { getPercentualProgress } from '../../utils/backups-progress';
import { getBaseName, getExtension } from '../../utils/path';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import {
  Check,
  ClockCounterClockwise,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { fileIcon } from 'renderer/assets/icons/getIcon';
import { DeviceContext } from 'renderer/context/DeviceContext';

export default function SyncInfo() {
  const [items, setItems] = useState<ProcessInfoUpdatePayload[]>([]);

  const [syncStopped] = useSyncStopped();

  const [backupsBannerVisible, setBackupsBannerVisible] = useState(false);

  useEffect(() => {
    const removeListener = window.electron.onSyncInfoUpdate(onSyncItem);

    return removeListener;
  }, []);

  function onSyncStatusChanged(value: SyncStatus) {
    if (value === 'RUNNING') {
      clearItems();
    }
  }

  useSyncStatus(onSyncStatusChanged);

  function onSyncItem(item: ProcessInfoUpdatePayload) {
    const MAX_ITEMS = 50;

    setItems((currentItems) => {
      const itemsWithoutGivenItem = currentItems.filter(
        (i) => i.name !== item.name
      );

      const itemIsAnError = [
        'UPLOAD_ERROR',
        'DOWNLOAD_ERROR',
        'RENAME_ERROR',
        'DELETE_ERROR',
        'METADATA_READ_ERROR',
      ].includes(item.action);

      const newItems = itemIsAnError
        ? itemsWithoutGivenItem
        : [item, ...itemsWithoutGivenItem].slice(0, MAX_ITEMS);

      return newItems;
    });
  }

  function clearItems() {
    setItems((current) =>
      current.filter((item) =>
        ['UPLOADING', 'DOWNLOADING', 'RENAMING', 'DELETING'].includes(
          item.action
        )
      )
    );
  }

  function removeOnProgressItems() {
    setItems((currentItems) => {
      return currentItems.filter(
        (item) =>
          item.action !== 'UPLOADING' &&
          item.action !== 'DOWNLOADING' &&
          item.action !== 'RENAMING' &&
          item.action !== 'DELETING'
      );
    });
  }

  useEffect(() => {
    if (syncStopped) {
      removeOnProgressItems();
    }
  }, [syncStopped]);

  return (
    <div className="no-scrollbar relative flex flex-1 flex-col overflow-y-auto">
      {/* <div className="absolute left-0 top-0 flex w-full justify-end p-1">
        <button
          tabIndex={0}
          type="button"
          className={`select-none rounded bg-gray-5 px-2 text-xs font-medium text-gray-50 hover:text-gray-80 ${
            items.length === 0 ? 'opacity-0' : ''
          }`}
          onClick={clearItems}
          disabled={items.length === 0}
        >
          Clear
        </button>
      </div> */}
      {/* [BACKUPS] widget info disabled while beta developing */}
      {/* <BackupsBanner
        onVisibilityChanged={setBackupsBannerVisible}
        className={items.length > 0 ? 'mt-8' : ''}
      /> */}
      {items.length === 0 && !backupsBannerVisible && <Empty />}
      <div className="flex-1">
        <AnimatePresence>
          {items.map((item, i) => (
            <AnimationWrapper key={item.name} i={i}>
              <Item {...item} />
            </AnimationWrapper>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AnimationWrapper({ children, i }: { children: ReactNode; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { delay: i * 0.03 } }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}

function Item({
  name,
  action,
  progress,
  errorName,
}: ProcessInfoUpdatePayload & {
  progress?: number;
  errorName?: ProcessErrorName;
}) {
  const { translate } = useTranslationContext();
  const progressDisplay = progress ? `${Math.ceil(progress * 100)}%` : '';

  let operation: Operation | undefined;
  if (
    action === 'DELETING' ||
    action === 'DELETED' ||
    action === 'DELETE_ERROR'
  ) {
    operation = 'delete';
  } else if (
    action === 'DOWNLOADING' ||
    action === 'DOWNLOADED' ||
    action === 'DOWNLOAD_ERROR'
  ) {
    operation = 'download';
  } else if (
    action === 'UPLOADING' ||
    action === 'UPLOADED' ||
    action === 'UPLOAD_ERROR'
  ) {
    operation = 'upload';
  } else if (
    action === 'RENAMING' ||
    action === 'RENAMED' ||
    action === 'RENAME_ERROR'
  ) {
    operation = 'rename';
  }

  let description = '';

  if (action === 'DOWNLOADING') {
    description = progress
      ? translate('widget.body.activity.operation.downloading')
      : translate('widget.body.activity.operation.decrypting');
  } else if (action === 'UPLOADING') {
    description = progress
      ? translate('widget.body.activity.operation.uploading')
      : translate('widget.body.activity.operation.encrypting');
  } else if (action === 'DOWNLOADED') {
    description = translate('widget.body.activity.operation.downloaded');
  } else if (action === 'UPLOADED') {
    description = translate('widget.body.activity.operation.uploaded');
  } else if (action === 'DELETING') {
    description = translate('widget.body.activity.operation.deleting');
  } else if (action === 'DELETED') {
    description = translate('widget.body.activity.operation.deleted');
  } else if (action === 'RENAMING') {
    description = translate('widget.body.activity.operation.renaming');
  } else if (action === 'RENAMED') {
    description = translate('widget.body.activity.operation.renamed');
  } else if (errorName) {
    description = shortMessages[errorName];
  }

  return (
    <div className="flex h-14 w-full px-3">
      <div className="flex h-full flex-1 items-center space-x-3 truncate border-b border-gray-5">
        <div className="flex h-8 w-8 items-center justify-center drop-shadow-sm">
          {fileIcon(getExtension(name))}
        </div>

        <div className="flex flex-1 flex-col justify-center space-y-px truncate pr-[14px]">
          <p
            className="truncate text-sm text-gray-100"
            title={getBaseName(name)}
          >
            {getBaseName(name)}
          </p>
          <p
            className={`truncate text-xs text-gray-50 ${
              action &&
              (action === 'DELETE_ERROR' ||
                action === 'DOWNLOAD_ERROR' ||
                action === 'UPLOAD_ERROR' ||
                action === 'RENAME_ERROR' ||
                action === 'METADATA_READ_ERROR')
                ? 'text-red'
                : undefined
            }`}
            title={
              action &&
              (action === 'DELETE_ERROR' ||
                action === 'DOWNLOAD_ERROR' ||
                action === 'UPLOAD_ERROR' ||
                action === 'RENAME_ERROR' ||
                action === 'METADATA_READ_ERROR')
                ? description
                : undefined
            }
          >
            {`${description} ${progressDisplay}`}
          </p>
        </div>

        <div className="flex w-7 items-center justify-center">
          {/* PROGRESS */}
          {action &&
            (action === 'UPLOADING' ||
              action === 'DOWNLOADING' ||
              action === 'RENAMING' ||
              action === 'DELETING') && (
              <CircularProgressbar
                value={progress ?? 0}
                minValue={0}
                maxValue={1}
                strokeWidth={16}
                styles={buildStyles({
                  pathTransitionDuration: 0.25,
                  pathColor: 'rgb(var(--color-primary) / 1)',
                  strokeLinecap: 'round',
                })}
                className="aspect-square w-6 rounded-full ring-4 ring-inset ring-primary/15 dark:ring-gray-10"
              />
            )}

          {/* DONE */}
          {action &&
            (action === 'DELETED' ||
              action === 'DOWNLOADED' ||
              action === 'UPLOADED' ||
              action === 'RENAMED') && (
              <Check size={24} className="text-green" weight="bold" />
            )}

          {/* ERROR */}
          {action &&
            (action === 'DELETE_ERROR' ||
              action === 'DOWNLOAD_ERROR' ||
              action === 'UPLOAD_ERROR' ||
              action === 'RENAME_ERROR' ||
              action === 'METADATA_READ_ERROR') && (
              <WarningCircle size={24} className="text-red" weight="regular" />
            )}
        </div>
      </div>
    </div>
  );
}

function Empty() {
  const { translate } = useTranslationContext();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.4 } }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <div className="trasform absolute left-1/2 top-1/2 flex w-full -translate-x-1/2 -translate-y-1/2 flex-col items-center space-y-6 text-center">
          <div>
            <img
              src={syncedStackLight}
              className="dark:hidden"
              width={128}
              draggable={false}
            />
            <img
              src={syncedStackDark}
              className="hidden dark:flex"
              width={128}
              draggable={false}
            />
          </div>

          <div className="flex flex-col">
            <p className="text-base font-medium text-gray-100">
              {translate('widget.body.upToDate.title')}
            </p>
            <p className="text-sm text-gray-60">
              {translate('widget.body.upToDate.subtitle')}
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function BackupsBanner({
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
