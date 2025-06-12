import { getUserSystemPath } from '../device/service';
import { Antivirus } from './Antivirus';
import { transformItem } from './utils/transformItem';
import { queue } from 'async';
import { DBScannerConnection } from './utils/dbConections';
import { ScannedItemCollection } from '../database/collections/ScannedItemCollection';
import { isPermissionError } from './utils/isPermissionError';
import { logger } from '@/apps/shared/logger/logger';
import { getFilesFromDirectory } from './utils/get-files-from-directory';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const BACKGROUND_MAX_CONCURRENCY = 5;

let dailyScanInterval: NodeJS.Timeout | null = null;

export function scheduleDailyScan() {
  async function startBackgroundScan() {
    console.log('Starting user system scan (BACKGROUND)...');
    await scanInBackground();
  }

  startBackgroundScan().catch((err) => {
    console.error('Error in initial background scan:', err);
  });

  dailyScanInterval = setInterval(() => {
    startBackgroundScan().catch((err) => {
      console.error('Error in scheduled background scan:', err);
    });
  }, ONE_DAY_MS);
}

export function clearDailyScan() {
  if (dailyScanInterval) {
    clearInterval(dailyScanInterval);
    dailyScanInterval = null;
  }
}

const scanInBackground = async (): Promise<void> => {
  const hashedFilesAdapter = new ScannedItemCollection();
  const database = new DBScannerConnection(hashedFilesAdapter);
  const antivirus = await Antivirus.createInstance();

  const userSystemPath = await getUserSystemPath();
  if (!userSystemPath) return;

  logger.debug({
    tag: 'ANTIVIRUS',
    msg: 'Starting background scan',
    userSystemPath,
  });

  console.time('scan-background');

  const scan = async (filePath: string) => {
    try {
      const scannedItem = await transformItem(filePath);
      const previousScannedItem = await database.getItemFromDatabase(scannedItem.pathName);
      if (previousScannedItem) {
        if (scannedItem.updatedAtW === previousScannedItem.updatedAtW || scannedItem.hash === previousScannedItem.hash) {
          return;
        }

        const currentScannedFile = await antivirus.scanFile(scannedItem.pathName);
        if (currentScannedFile) {
          await database.updateItemToDatabase(previousScannedItem.id, {
            ...scannedItem,
            isInfected: currentScannedFile.isInfected,
          });
        }
        return;
      }

      const currentScannedFile = await antivirus.scanFile(scannedItem.pathName);

      if (currentScannedFile) {
        await database.addItemToDatabase({
          ...scannedItem,
          isInfected: currentScannedFile.isInfected,
        });
      }
    } catch (error) {
      if (!isPermissionError(error)) {
        throw error;
      }
    }
  };

  try {
    const backgroundQueue = queue(scan, BACKGROUND_MAX_CONCURRENCY);

    const filePaths = await getFilesFromDirectory({ rootFolder: userSystemPath.path });

    logger.debug({
      tag: 'ANTIVIRUS',
      msg: 'Retrieved all files',
      totalFiles: filePaths.length,
    });

    if (filePaths.length > 0) {
      await backgroundQueue.pushAsync(filePaths);
      await backgroundQueue.drain();
    }

    logger.debug({ tag: 'ANTIVIRUS', msg: 'Background scan completed' });
  } catch (error) {
    if (!isPermissionError(error)) {
      throw error;
    }
  } finally {
    console.timeEnd('scan-background');
  }
};
