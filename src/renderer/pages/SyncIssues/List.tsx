import { MouseEvent, useState } from 'react';
import { UilInfoCircle, UilAngleDown } from '@iconscout/react-unicons';
import { motion, AnimatePresence } from 'framer-motion';
import { SyncIssue } from '../../../workers/sync';
import { SyncErrorName } from '../../../workers/sync/sync';
import WarnIcon from '../../assets/warn.svg';
import FileIcon from '../../assets/file.svg';
import { shortMessages } from '../../messages/sync-error';
import getDisplayName from '../../utils/get-display-name';

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
    <div className="flex-grow border bg-white border-l-neutral-30 rounded-lg m-4 min-h-0 overflow-y-auto no-scrollbar">
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
    <div className="flex items-center justify-center select-none h-full">
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
      className="p-2 hover:bg-l-neutral-10 active:bg-l-neutral-20 select-none"
      role="button"
      onKeyPress={onClick}
      tabIndex={0}
    >
      <div className="flex items-center">
        <WarnIcon className="h-7 w-7 mr-3" />
        <div className="flex-grow">
          <h1 className="font-semibold text-gray-70">
            {shortMessages[errorName]}
            &nbsp;
            <UilInfoCircle
              className="h-4 w-4 text-blue-60 hover:text-blue-50 active:text-blue-60 inline"
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
            className="pl-10 overflow-hidden"
          >
            {issues.map((issue) => (
              <div
                className="flex items-center min-w-0 overflow-hidden mt-2"
                key={issue.name}
              >
                <FileIcon className="h-5 w-5 flex-shrink-0" />
                <p className="flex-grow text-gray-70 ml-2 truncate">
                  {getDisplayName(issue.name)}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
