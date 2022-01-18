import { useEffect, useState } from 'react';
import { SyncStatus } from '../../../main/main';
import { SyncInfoUpdatePayload } from '../../../workers/sync';
import FileIcon from '../../assets/file.svg';
import FileWithOperation, {
  Operation,
} from '../../components/FileWithOperation';
import useSyncStatus from '../../hooks/SubscribeToSyncStatus';
import { shortMessages } from '../../messages/sync-error';

export default function SyncInfo() {
  const [items, setItems] = useState<SyncInfoUpdatePayload[]>([]);

  useEffect(() => {
    const removeListener = window.electron.onSyncInfoUpdate(onSyncItem);
    return removeListener;
  }, []);

  function onSyncStatusChanged(value: SyncStatus) {
    if (value === 'RUNNING') clearItems();
  }

  useSyncStatus(onSyncStatusChanged);

  function onSyncItem(item: SyncInfoUpdatePayload) {
    const MAX_ITEMS = 50;

    setItems((currentItems) => {
      const itemsWithoutGivenItem = currentItems.filter(
        (i) => i.name !== item.name
      );

      const newItems = [item, ...itemsWithoutGivenItem].slice(0, MAX_ITEMS);

      return newItems;
    });
  }

  function clearItems() {
    setItems([]);
  }

  return (
    <div className="flex-grow min-h-0 bg-l-neutral-10 border-t border-t-l-neutral-30 px-3 relative">
      <div className="flex w-full justify-end absolute top-0 left-0 p-3">
        <div className="bg-l-neutral-10 px-2 rounded">
          <button
            tabIndex={0}
            type="button"
            className={`text-xs font-medium text-blue-60 select-none ${
              items.length === 0 ? 'opacity-0' : ''
            }`}
            onClick={clearItems}
            disabled={items.length === 0}
          >
            Clear
          </button>
        </div>
      </div>

      {items.length === 0 && <Empty />}
      <div className="overflow-y-auto scroll h-full no-scrollbar">
        {items.map((item) => (
          <Item key={item.name} {...item} />
        ))}
      </div>
    </div>
  );
}

function Item({
  name,
  action,
  kind,
  progress,
  errorName,
}: SyncInfoUpdatePayload) {
  const progressDisplay =
    progress !== undefined ? `${(progress * 100).toFixed(0)}%` : '';

  let operation: Operation | undefined;
  if (action === 'DELETE' || action === 'DELETED' || action === 'DELETE_ERROR')
    operation = 'delete';
  else if (action === 'PULL' || action === 'PULLED' || action === 'PULL_ERROR')
    operation = kind === 'LOCAL' ? 'download' : 'upload';

  let description = '';

  if (action === 'PULL' && kind === 'LOCAL') description = 'Downloading';
  else if (action === 'PULL' && kind === 'REMOTE') description = 'Uploading';
  else if (action === 'PULLED' && kind === 'LOCAL') description = 'Downloaded';
  else if (action === 'PULLED' && kind === 'REMOTE') description = 'Uploaded';
  else if (action === 'DELETE' && kind === 'LOCAL')
    description = 'Deleting from your computer';
  else if (action === 'DELETE' && kind === 'REMOTE')
    description = 'Deleting from Internxt Drive';
  else if (action === 'DELETED' && kind === 'LOCAL')
    description = 'Deleted from your computer';
  else if (action === 'DELETED' && kind === 'REMOTE')
    description = 'Deleted from Internxt Drive';
  else if (errorName) description = shortMessages[errorName];

  return (
    <div className="h-10 my-4 flex items-center w-full overflow-hidden">
      <FileWithOperation
        operation={operation}
        className="flex-shrink-0"
        width={24}
      />
      <div className="ml-4 overflow-hidden">
        <h2 className="text-neutral-700 font-medium truncate text-sm">
          {name}
        </h2>
        <p className="text-neutral-500 text-xs">
          {description}
          <span>&nbsp;{progressDisplay}</span>
        </p>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="absolute left-1/2 top-1/2 trasform -translate-x-1/2 -translate-y-1/2 w-full text-center select-none">
      <div className="relative h-16">
        <div className="absolute transform rotate-12 left-1/2 -translate-x-6 opacity-60">
          <FileIcon className="h-16 w-16" />
        </div>
        <div className="absolute transform -rotate-12 left-1/2 -translate-x-10">
          <FileIcon className="h-16 w-16" />
        </div>
      </div>
      <p className="mt-7 text-sm text-blue-100">There is no recent activity</p>
      <p className="mt-1 text-xs text-m-neutral-100 px-4">
        Information will show up here when changes are made to sync your local
        folder with Internxt Drive
      </p>
    </div>
  );
}
