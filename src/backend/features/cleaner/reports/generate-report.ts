import { logger } from '@internxt/drive-desktop-core/build/backend';
import { CleanableItem, CleanerSectionKey } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';

type Props = {
  sectionKey: CleanerSectionKey;
  promises: Promise<CleanableItem[]>[];
};

export async function generateReport({ promises, sectionKey }: Props) {
  const startTime = performance.now();

  const results = await Promise.allSettled(promises);

  const items = results.filter((result) => result.status === 'fulfilled').flatMap((result) => result.value);

  const totalSizeInBytes = items.reduce((sum, item) => sum + item.sizeInBytes, 0);

  const endTime = performance.now();

  logger.debug({
    tag: 'CLEANER',
    msg: 'Report section completed',
    sectionKey,
    items: items.length,
    totalSizeInBytes,
    time: `${(endTime - startTime) / 1000}s`,
  });

  return {
    totalSizeInBytes,
    items,
  };
}
