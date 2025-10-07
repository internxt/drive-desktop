import { CleanableItem } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';

type Props = {
  promises: Promise<CleanableItem[]>[];
};

export async function generateReport({ promises }: Props) {
  const results = await Promise.allSettled(promises);

  const allItems = results.filter((result) => result.status === 'fulfilled').flatMap((result) => result.value);

  const totalSizeInBytes = allItems.reduce((sum, item) => sum + item.sizeInBytes, 0);

  return {
    totalSizeInBytes,
    items: allItems,
  };
}
