import { MouseEvent, useEffect, useState } from 'react';
import { UilInfoCircle, UilAngleDown } from '@iconscout/react-unicons';
import { motion, AnimatePresence } from 'framer-motion';
import WarnIcon from '../../assets/warn.svg';
import ErrorIcon from '../../assets/error.svg';
import FileIcon from '../../assets/file.svg';
import { shortMessages } from '../../messages/process-error';
import { getBaseName } from '../../utils/path';
import {
  ProcessErrorName,
  ProcessFatalErrorName,
  ProcessIssue,
} from '../../../workers/types';
import { BackupFatalError } from '../../../main/background-processes/backups';
import messages from '../../messages/process-fatal-error';

export default function ProcessIssuesList({
  processIssues,
  backupFatalErrors,
  showBackupFatalErrors,
  onClickOnErrorInfo,
}: {
  processIssues: ProcessIssue[];
  backupFatalErrors: BackupFatalError[];
  showBackupFatalErrors: boolean;
  onClickOnErrorInfo: (
    errorClicked: Pick<ProcessIssue, 'errorName' | 'errorDetails'>
  ) => void;
}) {
  const [selectedErrorName, setSelectedErrorName] =
    useState<ProcessErrorName | null>(null);

  useEffect(() => {
    setSelectedErrorName(null);
  }, [processIssues]);

  const errors = [...new Set(processIssues.map((issue) => issue.errorName))];

  function onInfoClick(errorName: ProcessErrorName) {
    onClickOnErrorInfo({
      errorName,
      errorDetails: processIssues.find((i) => i.errorName === errorName)!
        .errorDetails,
    });
  }

  const defaultAction = {
    name: 'Try again',
    func: window.electron.startBackupsProcess,
  };

  const fatalErrorActionMap: Record<
    ProcessFatalErrorName,
    { name: string; func: () => void }
  > = {
    CANNOT_ACCESS_BASE_DIRECTORY: {
      name: 'Find folder',
      func: () => undefined,
    },
    CANNOT_ACCESS_TMP_DIRECTORY: defaultAction,
    CANNOT_GET_CURRENT_LISTINGS: defaultAction,
    NO_INTERNET: defaultAction,
    NO_REMOTE_CONNECTION: defaultAction,
    UNKNOWN: defaultAction,
  };

  return (
    <div className="no-scrollbar m-4 min-h-0 flex-grow overflow-y-auto rounded-lg border border-l-neutral-30 bg-white">
      {showBackupFatalErrors &&
        backupFatalErrors.map((error) => (
          <FatalError
            key={error.folderId}
            errorName={error.errorName}
            path={error.path}
            actionName={fatalErrorActionMap[error.errorName].name}
            onActionClick={fatalErrorActionMap[error.errorName].func}
          />
        ))}
      {errors.map((error) => (
        <Item
          key={error}
          onClick={() =>
            selectedErrorName === error
              ? setSelectedErrorName(null)
              : setSelectedErrorName(error)
          }
          onInfoClick={() => onInfoClick(error)}
          errorName={error}
          issues={processIssues.filter((i) => i.errorName === error)}
          isSelected={selectedErrorName === error}
        />
      ))}
      {errors.length === 0 &&
        (backupFatalErrors.length === 0 || !showBackupFatalErrors) && <Empty />}
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-full select-none items-center justify-center">
      <p className="text-xs font-medium text-m-neutral-60">No issues found</p>
    </div>
  );
}

function Item({
  errorName,
  issues,
  isSelected,
  onClick,
  onInfoClick,
}: {
  errorName: ProcessErrorName;
  issues: ProcessIssue[];
  isSelected: boolean;
  onClick: () => void;
  onInfoClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="select-none p-2 hover:bg-l-neutral-10 active:bg-l-neutral-20"
      role="button"
      onKeyPress={onClick}
      tabIndex={0}
    >
      <div className="flex items-center">
        <WarnIcon className="mr-3 h-7 w-7" />
        <div className="flex-grow">
          <h1 className="font-semibold text-gray-70">
            {shortMessages[errorName]}
            &nbsp;
            <UilInfoCircle
              className="inline h-4 w-4 text-blue-60 hover:text-blue-50 active:text-blue-60"
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                onInfoClick();
              }}
            />
          </h1>
          <p className="text-gray-70">{issues.length} files</p>
        </div>
        <UilAngleDown
          className={`h-4 w-4 transform transition-all ${
            isSelected ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </div>
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { height: 'auto' },
              collapsed: { height: 0 },
            }}
            transition={{ ease: 'easeInOut' }}
            className="overflow-hidden pl-10"
          >
            {issues.map((issue) => (
              <div
                className="mt-2 flex min-w-0 items-center overflow-hidden"
                key={issue.name}
              >
                <FileIcon className="h-5 w-5 flex-shrink-0" />
                <p className="ml-2 flex-grow truncate text-gray-70">
                  {getBaseName(issue.name)}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FatalError({
  errorName,
  path,
  onActionClick,
  actionName,
}: {
  errorName: ProcessFatalErrorName;
  path: string;
  actionName: string;
  onActionClick: () => void;
}) {
  return (
    <div className="select-none p-2 hover:bg-l-neutral-10 active:bg-l-neutral-20">
      <div className="flex items-center">
        <ErrorIcon className="mr-3 h-7 w-7" />
        <div className="flex-grow">
          <h1 className="font-semibold text-gray-70">
            {window.electron.path.basename(path)}
          </h1>
          <p className="text-gray-70">
            {messages[errorName]}
            <span
              onClick={onActionClick}
              role="button"
              tabIndex={0}
              onKeyDown={onActionClick}
              className="ml-2 cursor-pointer text-blue-60 underline"
            >
              {actionName}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
