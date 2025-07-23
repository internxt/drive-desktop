import { getUserSystemPath } from '../device/service';
import { AntivirusManager } from './antivirus-manager/antivirus-manager';
import { queue } from 'async';
import { DBScannerConnection } from './utils/dbConections';
import { ScannedItemCollection } from '../database/collections/ScannedItemCollection';
import { isPermissionError } from './utils/isPermissionError';
import { logger } from '@/apps/shared/logger/logger';
import { getFilesFromDirectory } from './utils/get-files-from-directory';
import { scanFile } from './scan-file';

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
  const antivirusManager = AntivirusManager.getInstance();
  const antivirus = await antivirusManager.getActiveEngine();

  if (!antivirus) {
    logger.error({ tag: 'ANTIVIRUS', msg: 'No active antivirus engine found' });
    return;
  }

  const userSystemPath = await getUserSystemPath();
  if (!userSystemPath) return;

  logger.debug({
    tag: 'ANTIVIRUS',
    msg: 'Starting background scan',
    userSystemPath,
  });

  console.time('scan-background');

  try {
    const backgroundQueue = queue(async (filePath: string) => {
      await scanFile({
        filePath,
        database,
        antivirus,
      });
    }, BACKGROUND_MAX_CONCURRENCY);

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
