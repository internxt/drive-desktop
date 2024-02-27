import { AnimatePresence } from 'framer-motion';
import { useOnSyncRunning } from '../../hooks/useOnSyncRunning';
import { useOnSyncStopped } from '../../hooks/useOnSyncStopped';
import { useDriveInfoHistory } from '../../hooks/useDriveInfoHistory';
import { AnimationWrapper } from './AnimationWrapper';
import { Item } from './Item';
import { NoInfoToShow } from './NoInfoToShow';

export default function SyncInfo() {
  const { driveHistory, clearHistory, removeDriveOperationsInProgress } =
    useDriveInfoHistory();

  useOnSyncStopped(removeDriveOperationsInProgress);
  useOnSyncRunning(clearHistory);

  return (
    <div className="no-scrollbar relative flex flex-1 flex-col overflow-y-auto">
      {driveHistory.length === 0 && <NoInfoToShow />}
      <div className="flex-1">
        <AnimatePresence>
          {driveHistory.map((item, i) => (
            <AnimationWrapper key={item.name} i={i}>
              <Item {...item} />
            </AnimationWrapper>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
