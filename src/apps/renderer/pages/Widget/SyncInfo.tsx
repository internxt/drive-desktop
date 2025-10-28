import { useSyncInfoSubscriber } from '../../hooks/useSyncInfoSubscriber';
import { Item } from './Item';
import { NoInfoToShow } from './NoInfoToShow';

export default function SyncInfo() {
  const { processInfoUpdatedPayload } = useSyncInfoSubscriber();

  return (
    <div className="no-scrollbar relative flex flex-1 flex-col overflow-y-auto">
      {processInfoUpdatedPayload.length === 0 && <NoInfoToShow />}
      <div className="flex-1">
        {processInfoUpdatedPayload.map((item) => (
          <Item {...item} />
        ))}
      </div>
    </div>
  );
}
