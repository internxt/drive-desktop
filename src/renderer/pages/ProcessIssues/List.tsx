import { MouseEvent, useState } from 'react';
import { UilInfoCircle, UilAngleDown } from '@iconscout/react-unicons';
import { motion, AnimatePresence } from 'framer-motion';
import WarnIcon from '../../assets/warn.svg';
import ErrorIcon from '../../assets/error.svg';
import FileIcon from '../../assets/file.svg';
import Spinner from '../../assets/spinner.svg';
import { shortMessages } from '../../messages/process-error';
import { generalErrors } from '../../messages/general-error';

import { getBaseName } from '../../utils/path';
import {
  GeneralErrorName,
  GeneralIssue,
  ProcessErrorName,
  ProcessFatalErrorName,
  ProcessIssue,
} from '../../../workers/types';
import { BackupFatalError } from '../../../main/background-processes/types/BackupFatalError';
import messages from '../../messages/process-fatal-error';
import useFatalErrorActions from '../../hooks/FatalErrorActions';
import { Action } from '../../actions/types';
import { useTranslationContext } from 'renderer/context/LocalContext';

export default function ProcessIssuesList({
  selectedTab,
  processIssues,
  backupFatalErrors,
  showBackupFatalErrors,
  onClickOnErrorInfo,
  generalIssues,
}: {
  generalIssues: GeneralIssue[];
  processIssues: ProcessIssue[];
  backupFatalErrors: BackupFatalError[];
  showBackupFatalErrors: boolean;
  selectedTab: 'SYNC' | 'BACKUPS' | 'GENERAL';
  onClickOnErrorInfo: (
    errorClicked: Pick<ProcessIssue, 'errorName' | 'errorDetails'>
  ) => void;
}) {
  const { translate } = useTranslationContext();
  const [isLoading, setIsLoading] = useState(false);
  const fatalErrorActionMap = useFatalErrorActions(
    showBackupFatalErrors ? 'BACKUPS' : 'SYNC'
  );

  const [selectedErrorName, setSelectedErrorName] = useState<
    ProcessErrorName | GeneralErrorName | null
  >(null);

  const errors = [...new Set(processIssues.map((issue) => issue.errorName))];

  function onInfoClick(errorName: ProcessErrorName) {
    onClickOnErrorInfo({
      errorName,
      errorDetails: processIssues.find((i) => i.errorName === errorName)!
        .errorDetails,
    });
  }

  const renderItems = () => {
    if (selectedTab === 'GENERAL') {
      return generalIssues.map((issue) => {
        const error = issue.errorName;
        return (
          <GeneralIssueItem
            onClick={() =>
              selectedErrorName === error
                ? setSelectedErrorName(null)
                : setSelectedErrorName(error)
            }
            key={error}
            errorName={error}
            isSelected={selectedErrorName === error}
            issues={generalIssues.filter((i) => i.errorName === error)}
          />
        );
      });
    }

    return errors.map((error) => (
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
    ));
  };
  const actionWrapper =
    (action: Action) => async (error: BackupFatalError | undefined) => {
      setIsLoading(true);
      await action.func(error);
      setIsLoading(false);
    };

  const issuesIsEmpty = () => {
    switch (selectedTab) {
      case 'GENERAL':
        return generalIssues.length === 0;
      case 'SYNC':
        return processIssues.length === 0;
      case 'BACKUPS':
        return backupFatalErrors.length === 0;
      default:
        return true;
    }
  };

  return (
    <div className="no-scrollbar relative m-4 min-h-0 flex-grow overflow-y-auto rounded-lg border border-l-neutral-30 bg-white">
      {showBackupFatalErrors &&
        backupFatalErrors.map((error) => (
          <FatalError
            key={error.folderId}
            errorName={error.errorName}
            path={error.path}
            actionName={translate(fatalErrorActionMap[error.errorName].name)}
            onActionClick={() =>
              actionWrapper(fatalErrorActionMap[error.errorName])(error)
            }
          />
        ))}
      {renderItems()}

      {issuesIsEmpty() ? <Empty /> : null}
      {isLoading && (
        <Spinner className="absolute top-1 right-1 h-3 w-3 animate-spin fill-neutral-700" />
      )}
    </div>
  );
}

function Empty() {
  const { translate } = useTranslationContext();
  return (
    <div className="flex h-full select-none items-center justify-center">
      <p className="text-xs font-medium text-m-neutral-60">
        {translate('issues.no-issues')}
      </p>
    </div>
  );
}

function GeneralIssueItem({
  issues,
  isSelected,
  errorName,
  onClick,
}: {
  errorName: GeneralErrorName;
  issues: GeneralIssue[];
  isSelected: boolean;
  onClick: () => void;
}) {

  const { translate } = useTranslationContext();

  return (
    <div
      className="select-none p-2 hover:bg-l-neutral-10 active:bg-l-neutral-20"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyPress={onClick}
    >
      <div className="flex items-center">
        <WarnIcon className="mr-3 h-7 w-7" />
        <div className="flex-grow">
          <h1
            className="font-semibold text-gray-70"
            data-test="sync-issue-name"
          >
            {translate(generalErrors.shortMessages[errorName])}
            &nbsp;
            <UilInfoCircle className="inline h-4 w-4 text-blue-60 hover:text-blue-50 active:text-blue-60" />
          </h1>
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
                key={issue.errorDetails.name}
              >
                <FileIcon className="h-5 w-5 flex-shrink-0" />
                <p className="ml-2 flex-grow truncate text-gray-70">
                  {translate(generalErrors.longMessages[issue.errorName])}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
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
  const {translate} = useTranslationContext()
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
          <h1
            className="font-semibold text-gray-70"
            data-test="sync-issue-name"
          >
            {translate(shortMessages[errorName])}
            &nbsp;
            <UilInfoCircle
              className="inline h-4 w-4 text-blue-60 hover:text-blue-50 active:text-blue-60"
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                onInfoClick();
              }}
            />
          </h1>
          <p className="text-gray-70" data-test="number-sync-issues">
            {issues.length} files
          </p>
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
  const { translate } = useTranslationContext();

  return (
    <div className="select-none p-2 hover:bg-l-neutral-10 active:bg-l-neutral-20">
      <div className="flex items-center">
        <ErrorIcon className="mr-3 h-7 w-7" />
        <div className="flex-grow">
          <h1 className="font-semibold text-gray-70">
            {window.electron.path.basename(path)}
          </h1>
          <p className="text-gray-70">
            {translate(messages[errorName])}
            <span
              onClick={onActionClick}
              role="button"
              tabIndex={0}
              onKeyDown={onActionClick}
              className="ml-2 cursor-pointer text-sm text-blue-60 underline"
            >
              {actionName}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
