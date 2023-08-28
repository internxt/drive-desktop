import { CaretDown } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslationContext } from 'renderer/context/LocalContext';

import { BackupFatalError } from '../../../main/background-processes/types/BackupFatalError';
import {
  GeneralErrorName,
  GeneralIssue,
  ProcessErrorName,
  ProcessIssue,
} from '../../../workers/types';
import { Action } from '../../actions/types';
import FileIcon from '../../assets/file.svg';
import Spinner from '../../assets/spinner.svg';
import WarnIcon from '../../assets/warn.svg';
import useFatalErrorActions from '../../hooks/FatalErrorActions';
import { generalErrors } from '../../messages/general-error';
import { shortMessages } from '../../messages/process-error';
import { getBaseName } from '../../utils/path';
import Button from 'renderer/components/Button';
import { FatalError } from '../../components/Backups/FatalError';

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
    <ul className="relative m-5 mt-2 flex flex-1 flex-col divide-y divide-gray-5 overflow-y-auto rounded-lg border border-gray-20 bg-surface shadow-sm">
      {showBackupFatalErrors &&
        backupFatalErrors.map((error) => (
          <FatalError
            key={error.folderId}
            errorName={error.errorName}
            path={error.path}
            showIcon={true}
            actionName={translate(fatalErrorActionMap[error.errorName].name)}
            onActionClick={() =>
              actionWrapper(fatalErrorActionMap[error.errorName])(error)
            }
          />
        ))}
      {renderItems()}

      {issuesIsEmpty() ? <Empty /> : null}
      {isLoading && (
        <div className="absolute flex h-full w-full items-center justify-center bg-surface/75">
          <Spinner className="h-5 w-5 animate-spin text-gray-100" />
        </div>
      )}
    </ul>
  );
}

function Empty() {
  const { translate } = useTranslationContext();

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm font-medium text-gray-100">
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
    <li
      className="flex flex-col space-y-2.5 p-3 hover:bg-gray-5"
      onClick={onClick}
    >
      <div className="flex space-x-2.5">
        <WarnIcon className="h-5 w-5" />

        <h1
          className="flex flex-1 flex-col truncate text-base font-medium leading-5 text-gray-100"
          data-test="sync-issue-name"
        >
          {translate(generalErrors.shortMessages[errorName])}
        </h1>

        <CaretDown
          className={`transform transition-all duration-200 ${
            isSelected ? 'rotate-180' : 'rotate-0'
          }`}
          size={20}
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
            className="space-y-2 overflow-hidden rounded-lg border-gray-20 bg-surface p-3"
          >
            {issues.map((issue) => (
              <div
                className="flex min-w-0 items-center space-x-2.5 overflow-hidden"
                key={issue.errorDetails.name}
              >
                <FileIcon className="h-5 w-5 shrink-0" />
                <p className="flex flex-1 text-gray-60">
                  {translate(generalErrors.longMessages[issue.errorName])}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </li>
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
  const { translate } = useTranslationContext();

  return (
    <li
      onClick={onClick}
      className="flex flex-col space-y-2.5 p-3 hover:bg-gray-5"
    >
      <div className="flex space-x-2.5">
        <WarnIcon className="h-5 w-5" />

        <div className="flex flex-col space-y-1">
          <h1
            className="flex flex-1 flex-col truncate text-base font-medium leading-5 text-gray-100"
            data-test="sync-issue-name"
          >
            {translate(shortMessages[errorName])}
          </h1>

          <p className="text-gray-60" data-test="number-sync-issues">
            {issues.length} files
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="secondary" size="sm" onClick={onInfoClick}>
            Report
          </Button>

          <CaretDown
            className={`transform transition-all duration-200 ${
              isSelected ? 'rotate-180' : 'rotate-0'
            }`}
            size={20}
          />
        </div>
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
            className="space-y-2 overflow-hidden rounded-lg border-gray-20 bg-surface p-3"
          >
            {issues.map((issue) => (
              <div
                className="flex min-w-0 items-center space-x-2.5 overflow-hidden"
                key={issue.name}
              >
                <FileIcon className="h-5 w-5 shrink-0" />
                <p className="flex flex-1 text-gray-60">
                  {getBaseName(issue.name)}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
