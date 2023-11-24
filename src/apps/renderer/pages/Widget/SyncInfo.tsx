import { AnimatePresence } from 'framer-motion';
import { useOnSyncRunning } from '../../hooks/useOnSyncRunning';
import { useOnSyncStopped } from '../../hooks/useOnSyncStopped';
import { useSyncInfoSubscriber } from '../../hooks/useSyncInfoSubscriber';
import { AnimationWrapper } from './AnimationWrapper';
import { Item } from './Item';
import { NoInfoToShow } from './NoInfoToShow';

export default function SyncInfo() {
  const { processInfoUpdatedPayload, clearItems, removeOnProgressItems } =
    useSyncInfoSubscriber();

  useOnSyncStopped(removeOnProgressItems);
  useOnSyncRunning(clearItems);

  return (
    <div className="no-scrollbar relative flex flex-1 flex-col overflow-y-auto">
      {processInfoUpdatedPayload.length === 0 && <NoInfoToShow />}
      <div className="flex-1">
        <AnimatePresence>
          {processInfoUpdatedPayload.map((item, i) => (
            <AnimationWrapper key={item.name} i={i}>
              <Item {...item} />
            </AnimationWrapper>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
