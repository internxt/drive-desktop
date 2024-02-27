import { AnimatePresence, motion } from 'framer-motion';
import { CaretDown } from 'phosphor-react';
import { generalErrors } from '../../messages/general-error';
import FileIcon from '../../assets/file.svg';
import WarnIcon from '../../assets/warn.svg';
import { AppError } from '../../../../shared/issues/AppError';
import { AppIssue as GeneralIssue } from '../../../../shared/issues/AppIssue';
import { useState } from 'react';

function groupAppIssuesByErrorName(issues: GeneralIssue[]) {
  const appIssuesGroupedByErrorName = issues.reduce((acc, current) => {
    const key = current.errorName;

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(current);

    return acc;
  }, {} as Record<AppError, GeneralIssue[]>);

  return Object.entries(appIssuesGroupedByErrorName) as Array<
    [AppError, Array<GeneralIssue>]
  >;
}

function GeneralIssueAccordion({
  extend,
  errorName,
  issues,
}: {
  errorName: AppError;
  extend: boolean;
  issues: Array<GeneralIssue>;
}) {
  return (
    <>
      <div className="flex space-x-2.5" key={errorName}>
        <WarnIcon className="h-5 w-5" />

        <h1
          className="flex flex-1 flex-col truncate text-base font-medium leading-5 text-gray-100"
          data-test="sync-issue-name"
        >
          {generalErrors.shortMessages[errorName]}
        </h1>

        <CaretDown
          className={`transform transition-all duration-200 ${
            extend ? 'rotate-180' : 'rotate-0'
          }`}
          size={20}
        />
      </div>

      <AnimatePresence>
        {extend && (
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
            {issues.map((issue, index) => (
              <div
                className="flex min-w-0 items-center space-x-2.5 overflow-hidden"
                key={issue.errorName + index}
              >
                <FileIcon className="h-5 w-5 shrink-0" />
                <p className="flex flex-1 text-gray-60">
                  {generalErrors.longMessages[issue.errorName]}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

type AppIssueElementProps = {
  issues: Array<GeneralIssue>;
};

export function GeneralIssuesByErrorAccordion({
  issues,
}: AppIssueElementProps) {
  const [selected, setSelected] = useState<AppError | null>(null);

  const issuesByErrorNameArray = groupAppIssuesByErrorName(issues);

  const isSelected = (errorName: AppError) => {
    return errorName === selected;
  };

  const toggleOrSelectError = (clickedError: AppError) => () => {
    if (clickedError === selected) {
      setSelected(null);
      return;
    }

    setSelected(clickedError);
  };

  return (
    <ul>
      {issuesByErrorNameArray.map(([errorName, issues]) => (
        <li
          className="flex flex-col space-y-2.5 p-3 hover:bg-gray-5"
          onClick={toggleOrSelectError(errorName)}
          key={errorName}
        >
          <GeneralIssueAccordion
            extend={isSelected(errorName)}
            errorName={errorName}
            issues={issues}
          />
        </li>
      ))}
    </ul>
  );
}
