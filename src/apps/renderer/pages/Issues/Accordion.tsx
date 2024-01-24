import { AnimatePresence, motion } from 'framer-motion';
import { CaretDown } from 'phosphor-react';
import FileIcon from '../../assets/file.svg';
import WarnIcon from '../../assets/warn.svg';
import { getBaseName } from '../../utils/path';

type AccordionProps = {
  title: string;
  collapsed: boolean;
  elements: Array<string>;
};

export function Accordion({ title, collapsed, elements }: AccordionProps) {
  return (
    <>
      <div className="flex space-x-2.5">
        <WarnIcon className="h-5 w-5" />

        <div className="flex grow flex-col space-y-1">
          <h1
            className="flex flex-1 flex-col text-base font-medium leading-5 text-gray-100"
            data-test="sync-issue-name"
          >
            {title}
          </h1>

          <p className="text-gray-60" data-test="number-sync-issues">
            {elements.length} files
          </p>
        </div>

        <div className="flex items-center">
          <CaretDown
            className={`transform transition-all duration-200 ${
              collapsed ? 'rotate-0' : 'rotate-180'
            }`}
            size={20}
          />
        </div>
      </div>

      <AnimatePresence>
        {!collapsed && (
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
            {elements.map((element, index) => (
              <div
                className="flex min-w-0 items-center space-x-2.5 overflow-hidden"
                key={element + index}
              >
                <FileIcon className="h-5 w-5 shrink-0" />
                <p className="flex flex-1 text-gray-60">
                  {getBaseName(element)}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
