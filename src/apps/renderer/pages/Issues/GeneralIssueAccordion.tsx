import { type FC } from 'react';
import { GeneralIssue, GeneralIssueError } from 'src/apps/main/background-processes/issues';
import WarnIcon from 'src/apps/renderer/assets/warn.svg';
import { generalErrors } from 'src/apps/renderer/messages/general-error';
import { CaretDown } from 'phosphor-react';
import FileIcon from 'src/apps/renderer/assets/file.svg';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  errorName: GeneralIssueError;
  extend: boolean;
  issues: Array<GeneralIssue>;
}

const GeneralIssueAccordion: FC<Props> = ({ extend, errorName, issues }) => {
  return (
    <>
      <div className="flex space-x-2.5" key={errorName}>
        <WarnIcon className="h-5 w-5" />

        <h1 className="flex flex-1 flex-col truncate text-base font-medium leading-5 text-gray-100" data-test="sync-issue-name">
          {generalErrors.shortMessages[errorName]}
        </h1>

        <CaretDown className={`transform transition-all duration-200 ${extend ? 'rotate-180' : 'rotate-0'}`} size={20} />
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
            className="space-y-2 overflow-hidden rounded-lg border-gray-20 bg-surface p-3">
            {issues.map((issue, index) => (
              <div className="flex min-w-0 items-center space-x-2.5 overflow-hidden" key={`${issue.error}-${index}`}>
                <FileIcon className="h-5 w-5 shrink-0" />
                <p className="flex flex-1 text-gray-60">{generalErrors.longMessages[issue.error]}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GeneralIssueAccordion;
