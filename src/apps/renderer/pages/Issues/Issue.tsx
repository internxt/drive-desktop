import { AnimatePresence, motion } from 'framer-motion';
import { CaretDown } from 'phosphor-react';
import { ErrorCause } from '../../../shared/types';
import FileIcon from '../../assets/file.svg';
import WarnIcon from '../../assets/warn.svg';
import { useTranslationContext } from '../../context/LocalContext';
import { getBaseName } from '../../utils/path';
import { shortMessages } from '../../messages/virtual-drive-error';
import { VirtualDriveIssue } from '../../../../shared/issues/VirtualDriveIssue';

export function Issue({
  errorName,
  issues,
  isSelected,
  onClick,
}: {
  errorName: ErrorCause;
  issues: VirtualDriveIssue[];
  isSelected: boolean;
  onClick: () => void;
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
