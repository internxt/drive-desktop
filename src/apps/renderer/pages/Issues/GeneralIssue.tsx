import { AnimatePresence, motion } from 'framer-motion';
import { CaretDown } from 'phosphor-react';
import { useTranslationContext } from '../../context/LocalContext';
import { generalErrors } from '../../messages/general-error';
import FileIcon from '../../assets/file.svg';
import WarnIcon from '../../assets/warn.svg';
import { AppError, AppIssue } from '../../../../shared/issues/AppIssue';

export function AppIssueElement({
  issues,
  isSelected,
  errorName,
  onClick,
}: {
  errorName: AppError;
  issues: AppIssue[];
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
