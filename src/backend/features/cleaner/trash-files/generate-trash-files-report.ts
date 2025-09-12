import { CleanerSection, CleanableItem } from '../cleaner.types';
import { scanDirectory } from '../scan-directory';
import { getTrashFilesPaths } from './get-trash-files-paths';

/**
 * Generates a report for Trash Files section by scanning various trash directories
 * @returns Promise<CleanerSection> Report containing all trash files
 */
export async function generateTrashFilesReport(): Promise<CleanerSection> {
  const paths = getTrashFilesPaths();
  const allItems: CleanableItem[] = [];

  // Build array of scan promises for all available trash paths
  const scanPromises = [
    /**
     * Scan ~/.local/share/Trash/
     */
    scanDirectory({
      dirPath: paths.localShareTrash,
    }),
    /**
     * Scan ~/.Trash/
     */
    scanDirectory({
      dirPath: paths.legacyTrash,
    }),
  ];

  // Add XDG Data Home trash scanning if it exists and is different
  if (paths.xdgDataTrash) {
    scanPromises.push(
      /**
       * Scan $XDG_DATA_HOME/Trash/
       */
      scanDirectory({
        dirPath: paths.xdgDataTrash,
      })
    );
  }

  const results = await Promise.allSettled(scanPromises);

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
  });

  const totalSizeInBytes = allItems.reduce(
    (sum, item) => sum + item.sizeInBytes,
    0
  );

  return {
    totalSizeInBytes,
    items: allItems,
  };
}