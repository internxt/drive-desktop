import { AnimatePresence, motion } from 'framer-motion';

import syncedStackLight from '../../assets/illustrations/syncedStack-light.png';
import syncedStackDark from '../../assets/illustrations/syncedStack-dark.png';
import { useTranslationContext } from '../../context/LocalContext';

export function NoInfoToShow() {
  const { translate } = useTranslationContext();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.4 } }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <div className="trasform absolute left-1/2 top-1/2 flex w-full -translate-x-1/2 -translate-y-1/2 flex-col items-center space-y-6 text-center">
          <div>
            <img
              src={syncedStackLight}
              className="dark:hidden"
              width={128}
              draggable={false}
            />
            <img
              src={syncedStackDark}
              className="hidden dark:flex"
              width={128}
              draggable={false}
            />
          </div>

          <div className="flex flex-col">
            <p className="text-base font-medium text-gray-100">
              {translate('widget.body.upToDate.title')}
            </p>
            <p className="text-sm text-gray-60">
              {translate('widget.body.upToDate.subtitle')}
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
