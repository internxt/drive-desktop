import isPermissionError from '@internxt/scan/lib/isPermissionError';
import { getUserSystemPath } from '../device/service';
import { Antivirus } from './Antivirus';
import { getFilesFromDirectory } from './getFilesFromDirectory';
import { transformItem } from './utils/transformItem';
import { queue, QueueObject } from 'async';
import { DBScannerConnection } from './utils/dbConections';
import { HashedSystemTreeCollection } from '../database/collections/HashedSystemTreeCollection';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const BACKGROUND_MAX_CONCURRENCY = 5;

let dailyScanInterval: NodeJS.Timeout | null = null;

export function scheduleDailyScan() {
  async function startBackgroundScan() {
    console.log('STARTING USER SYSTEM SCAN (BACKGROUND)...');
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
  const hashedFilesAdapter = new HashedSystemTreeCollection();
  const database = new DBScannerConnection(hashedFilesAdapter);
  const antivirus = await Antivirus.getInstance();
  await antivirus.initialize();

  const userSystemPath = await getUserSystemPath();
  if (!userSystemPath) return;

  console.time('scan-background');

  const scan = async (filePath: string) => {
    console.log('SCAN ITEM IN BACKGROUND: ', filePath);
    try {
      const scannedItem = await transformItem(filePath);
      const previousScannedItem = await database.getItemFromDatabase(scannedItem.pathName);
      if (previousScannedItem) {
        if (scannedItem.updatedAtW === previousScannedItem.updatedAtW) {
          return;
        }

        if (scannedItem.hash === previousScannedItem.hash) {
          return;
        }

        const currentScannedFile = await antivirus.scanFile(scannedItem.pathName);
        if (currentScannedFile) {
          await database.updateItemToDatabase(previousScannedItem.id, {
            ...scannedItem,
            isInfected: currentScannedFile.isInfected,
          });
          return;
        }
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
    let backgroundQueue: QueueObject<string> | null = queue(scan, BACKGROUND_MAX_CONCURRENCY);

    await getFilesFromDirectory(userSystemPath.path, (file: string) => backgroundQueue!.pushAsync(file));

    await backgroundQueue.drain();

    console.log('LAST ITEM IN THE CALL');

    backgroundQueue = null;
  } catch (error) {
    if (!isPermissionError(error)) {
      throw error;
    }
  } finally {
    console.timeEnd('scan-background');
  }
};
