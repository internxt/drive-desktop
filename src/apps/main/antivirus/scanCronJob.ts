import { getUserSystemPath } from '../device/service';
import { Antivirus } from './Antivirus';
import { getFilesFromDirectory } from './utils/getFilesFromDirectory';
import { transformItem } from './utils/transformItem';
import { queue, QueueObject } from 'async';
import { DBScannerConnection } from './db/DBScannerConnection';
import { ScannedItemCollection } from '../database/collections/ScannedItemCollection';
import { isPermissionError } from './utils/isPermissionError';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { measurePerformance } from '../../../../src/core/utils/measure-execution-time';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const BACKGROUND_MAX_CONCURRENCY = 5;

let dailyScanInterval: NodeJS.Timeout | null = null;
let backgroundScanAbortController: AbortController | null = null;

async function scanInBackground() {
  const abortController = new AbortController();
  backgroundScanAbortController = abortController;

  const hashedFilesAdapter = new ScannedItemCollection();
  const database = new DBScannerConnection(hashedFilesAdapter);
  const antivirus = await Antivirus.createInstance();

  const userSystemPath = await getUserSystemPath();
  if (!userSystemPath) return;

  const scan = async (filePath: string) => {
    try {
      const scannedItem = await transformItem(filePath);
      const previousScannedItem = await database.getItemFromDatabase(scannedItem.pathName);
      if (previousScannedItem) {
        if (
          scannedItem.updatedAtW === previousScannedItem.updatedAtW ||
          scannedItem.hash === previousScannedItem.hash
        ) {
          return;
        }

        const currentScannedFile = await antivirus.scanFile(scannedItem.pathName, abortController.signal);
        if (currentScannedFile) {
          await database.updateItemToDatabase(previousScannedItem.id, {
            ...scannedItem,
            isInfected: currentScannedFile.isInfected,
          });
        }
        return;
      }

      const currentScannedFile = await antivirus.scanFile(scannedItem.pathName, abortController.signal);

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
    const backgroundQueue: QueueObject<string> = queue(scan, BACKGROUND_MAX_CONCURRENCY);

    await getFilesFromDirectory({
      dir: userSystemPath.path,
      cb: (file: string) => backgroundQueue.pushAsync(file),
      signal: abortController.signal,
    });

    await backgroundQueue.drain();
  } catch (error) {
    if (!isPermissionError(error)) {
      throw error;
    }
  }
}

export function scheduleDailyScan() {
  async function startBackgroundScan() {
    logger.debug({ tag: 'ANTIVIRUS', msg: 'Starting user system scan (BACKGROUND)...' });
    const time = await measurePerformance(scanInBackground);
    logger.debug({
      tag: 'ANTIVIRUS',
      msg: 'User system scan completed in seconds',
      time,
    });
  }

  startBackgroundScan().catch((err) => {
    logger.error({ tag: 'ANTIVIRUS', msg: 'Error in initial background scan:', err });
  });

  dailyScanInterval = setInterval(() => {
    const time = measurePerformance(startBackgroundScan).catch((err) => {
      logger.error({ tag: 'ANTIVIRUS', msg: 'Error in scheduled background scan:', err });
    });

    logger.debug({
      tag: 'ANTIVIRUS',
      msg: 'User system scan completed in seconds',
      time,
    });
  }, ONE_DAY_MS);
}

export function cancelBackgroundScan() {
  if (backgroundScanAbortController) {
    logger.debug({ tag: 'ANTIVIRUS', msg: 'Cancelling ongoing background scan' });
    backgroundScanAbortController.abort();
    backgroundScanAbortController = null;
  }
}

export function clearDailyScan() {
  cancelBackgroundScan();

  if (dailyScanInterval) {
    clearInterval(dailyScanInterval);
    dailyScanInterval = null;
  }
}
