import { UilHistory, UilMultiply } from '@iconscout/react-unicons';
import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode, useEffect, useState } from 'react';

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
import FileWithOperation, {
  Operation,
} from '../../components/FileWithOperation';
import { useTranslationContext } from '../../context/LocalContext';
import useBackupFatalErrors from '../../hooks/BackupFatalErrors';
import useBackupStatus from '../../hooks/BackupStatus';
import useProcessIssues from '../../hooks/ProcessIssues';
import useSyncStatus from '../../hooks/SyncStatus';
import useSyncStopped from '../../hooks/SyncStopped';
import { shortMessages } from '../../messages/process-error';
import { getPercentualProgress } from '../../utils/backups-progress';
import { getBaseName } from '../../utils/path';

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
    <div className="relative flex flex-1 flex-col">
      <div className="absolute left-0 top-0 flex w-full justify-end p-1">
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
      </div>
      {/* [BACKUPS] widget info disabled while beta developing
        <BackupsBanner
          onVisibilityChanged={setBackupsBannerVisible}
          className={items.length > 0 ? 'mt-8' : ''}
        />*/}
      {items.length === 0 && !backupsBannerVisible && <Empty />}
      <div className="scroll no-scrollbar h-full overflow-y-auto">
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

function AnimationWrapper({
  children,
  key,
  i,
}: {
  children: ReactNode;
  key: string;
  i: number;
}) {
  return (
    <motion.div
      key={key}
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
    description = progress ? 'Downloading' : 'Decrypting';
  } else if (action === 'UPLOADING') {
    description = progress ? 'Uploading' : 'Encrypting';
  } else if (action === 'DOWNLOADED') {
    description = 'Downloaded';
  } else if (action === 'UPLOADED') {
    description = 'Uploaded';
  } else if (action === 'DELETING') {
    description = 'Deleting';
  } else if (action === 'DELETED') {
    description = 'Deleted';
  } else if (action === 'RENAMING') {
    description = 'Renaming';
  } else if (action === 'RENAMED') {
    description = 'Renamed';
  } else if (errorName) {
    description = shortMessages[errorName];
  }

  const displayName = getBaseName(name);

  return (
    <div className="my-4 flex h-10 w-full select-none items-center overflow-hidden px-3">
      <FileWithOperation
        operation={operation}
        className="flex-shrink-0"
        width={24}
      />
      <div className="ml-4 overflow-hidden">
        <h2 className="truncate text-sm font-medium text-neutral-700">
          {displayName}
        </h2>
        <p className="text-xs text-neutral-500">
          {description}
          <span>&nbsp;{progressDisplay}</span>
        </p>
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
  const status = useBackupStatus();
  const fatalErrors = useBackupFatalErrors();
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
        ? `Backed up ${backupProgress.currentFolder - 1} out of ${backupProgress.totalFolders
        } folders`
        : 'Backing up your folder';

    const percentualProgress = getPercentualProgress(backupProgress);

    percentage = `${percentualProgress.toFixed(0)}%`;
  } else if (fatalErrors.length) {
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
    fatalErrors.length === 0 &&
    lastExit === 'PROCESS_FINISHED'
  ) {
    iconVariant = 'SUCCESS';
  } else if (fatalErrors.length) {
    iconVariant = 'ERROR';
  } else if (issues.length) {
    iconVariant = 'WARNING';
  }

  const show = (status !== 'STANDBY' || backupProgress) && !hidden;

  useEffect(() => {
    onVisibilityChanged(show as boolean);
  }, [status, backupProgress, hidden]);

  function onClick() {
    if (issues.length || fatalErrors.length) {
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

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className={`group relative flex h-14 w-full flex-shrink-0 cursor-pointer select-none items-center bg-blue-10 px-3 ${className}`}
          role="none"
          onClick={onClick}
        >
          <BackupsIcon variant={iconVariant} />
          <div className="ml-3">
            <h1 className="text-sm font-medium text-neutral-700">Backup</h1>
            <p className="text-xs font-medium text-neutral-500">
              {body}
              <span className="ml-1 text-neutral-500/50">{percentage}</span>
              <span className="ml-1 text-blue-60 underline">{action}</span>
            </p>
          </div>
          <UilMultiply
            onClick={(e: MouseEvent) => {
              e.stopPropagation();
              setHidden(true);
            }}
            className={`absolute right-5 top-1/2 hidden h-5 w-5 -translate-y-1/2 cursor-pointer text-neutral-500/50 hover:text-neutral-500/70 active:text-neutral-500 ${status === 'STANDBY' ? 'group-hover:block' : ''
              }`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BackupsIcon({
  variant,
}: {
  variant?: 'SUCCESS' | 'WARNING' | 'ERROR';
}) {
  return (
    <div className="relative">
      <UilHistory className="h-6 w-6 text-blue-60" />
      {variant === 'SUCCESS' && (
        <>
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-white" />
          <Success className="absolute bottom-0 right-0 h-3 w-3 " />
        </>
      )}
      {variant === 'WARNING' && (
        <Warn className="absolute bottom-0 right-0 h-3 w-3 " />
      )}
      {variant === 'ERROR' && (
        <Error className="absolute bottom-0 right-0 h-3 w-3 " />
      )}
    </div>
  );
}
