import { AnimatePresence } from 'framer-motion';
import { NoInfoToShow } from './NoInfoToShow';
import { Item } from './Item';
import { AnimationWrapper } from './AnimationWrapper';
import { useOnSyncRunning } from 'apps/renderer/hooks/useOnSyncRunning';
import { useOnSyncStopped } from 'apps/renderer/hooks/useOnSyncStopped';
import { useSyncInfoSubscriber } from 'apps/renderer/hooks/useSyncInfoSubscriber';

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
