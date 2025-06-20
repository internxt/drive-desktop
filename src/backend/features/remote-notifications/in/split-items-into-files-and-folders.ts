import { ItemsToTrashEvent } from '@/apps/main/notification-schema';

export const splitItemsIntoFilesAndFolders = ({ items }: { items: ItemsToTrashEvent['payload'] }) => {
  const files = items.filter((item): item is { type: 'file'; uuid: string } => item.type === 'file');
  const folders = items.filter((item): item is { type: 'folder'; uuid: string } => item.type === 'folder');
  return { files, folders };
};
