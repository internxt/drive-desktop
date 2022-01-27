import { MouseEvent, useState } from 'react';
import { UilInfoCircle, UilAngleDown } from '@iconscout/react-unicons';
import { motion, AnimatePresence } from 'framer-motion';
import { SyncIssue } from '../../../workers/sync';
import { SyncErrorName } from '../../../workers/sync/sync';
import WarnIcon from '../../assets/warn.svg';
import FileIcon from '../../assets/file.svg';
import { shortMessages } from '../../messages/sync-error';
import { getBaseName } from '../../utils/path';

export default function SyncIssuesList({
  syncIssues,
  onClickOnErrorInfo,
}: {
  syncIssues: SyncIssue[];
  onClickOnErrorInfo: (
    errorClicked: Pick<SyncIssue, 'errorName' | 'errorDetails'>
  ) => void;
}) {
  const [selectedErrorName, setSelectedErrorName] =
    useState<SyncErrorName | null>(null);

  const errors = [...new Set(syncIssues.map((issue) => issue.errorName))];

  function onInfoClick(errorName: SyncErrorName) {
    onClickOnErrorInfo({
      errorName,
      errorDetails: syncIssues.find((i) => i.errorName === errorName)!
        .errorDetails,
    });
  }
  return (
    <div className="no-scrollbar m-4 min-h-0 flex-grow overflow-y-auto rounded-lg border border-l-neutral-30 bg-white">
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
          issues={syncIssues.filter((i) => i.errorName === error)}
          isSelected={selectedErrorName === error}
        />
      ))}
      {errors.length === 0 && <Empty />}
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
  errorName: SyncErrorName;
  issues: SyncIssue[];
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
