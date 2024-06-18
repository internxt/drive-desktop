import { AnimatePresence, motion } from 'framer-motion';
import { CaretDown } from 'phosphor-react';
import FileIcon from '../../assets/file.svg';
import WarnIcon from '../../assets/warn.svg';
import { useTranslationContext } from '../../context/LocalContext';
import { getBaseName } from '../../utils/path';
import { shortMessages } from '../../messages/virtual-drive-error';
import { VirtualDriveIssue } from '../../../../shared/issues/VirtualDriveIssue';
import { SyncError } from '../../../../shared/issues/SyncErrorCause';
import { useState } from 'react';
import { Accordion } from './Accordion';

function groupAppIssuesByErrorName(issues: VirtualDriveIssue[]) {
  const appIssuesGroupedByErrorName = issues.reduce((acc, current) => {
    const key = current.cause;

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(current);

    return acc;
  }, {} as Record<SyncError, VirtualDriveIssue[]>);

  return Object.entries(appIssuesGroupedByErrorName) as Array<
    [SyncError, Array<VirtualDriveIssue>]
  >;
}

function VirtualDriveIssue({
  errorName,
  issues,
  extend,
}: {
  errorName: SyncError;
  issues: VirtualDriveIssue[];
  extend: boolean;
}) {
  const { translate } = useTranslationContext();

  return (
    <>
      <div className="flex space-x-2.5">
        <WarnIcon className="h-5 w-5" />

        <div className="flex flex-col space-y-1">
          <h1
            className="flex flex-1 flex-col text-base font-medium leading-5 text-gray-100"
            data-test="sync-issue-name"
          >
            {translate(shortMessages[errorName])}
          </h1>

          <p className="text-gray-60" data-test="number-sync-issues">
            {issues.length} files
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <CaretDown
            className={`transform transition-all duration-200 ${
              extend ? 'rotate-180' : 'rotate-0'
            }`}
            size={20}
          />
        </div>
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
    </>
  );
}

type VirtualDriveIssuesByErrorAccordionProps = {
  issues: Array<VirtualDriveIssue>;
};

export function SyncIssuesByError({
  issues,
}: VirtualDriveIssuesByErrorAccordionProps) {
  const { translate } = useTranslationContext();
  const [selected, setSelected] = useState<SyncError | null>(null);

  const issuesByCauseArray = groupAppIssuesByErrorName(issues);

  const isSelected = (cause: SyncError) => {
    return cause === selected;
  };

  const toggleOrSelectCause = (clickedCause: SyncError) => () => {
    if (clickedCause === selected) {
      setSelected(null);
      return;
    }

    setSelected(clickedCause);
  };

  return (
    <ul>
      {issuesByCauseArray.map(([cause, issues]) => (
        <li
          className="flex flex-col space-y-2.5 p-3 hover:bg-gray-5"
          onClick={toggleOrSelectCause(cause)}
          key={cause}
        >
          <Accordion
            title={translate(shortMessages[cause])}
            collapsed={!isSelected(cause)}
            elements={issues.map((issue) => getBaseName(issue.name))}
          />
        </li>
      ))}
    </ul>
  );
}
