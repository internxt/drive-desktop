import { logger } from '@/apps/shared/logger/logger';
import { DBScannerConnection } from './utils/dbConections';
import { transformItem } from './utils/transformItem';
import { AntivirusEngine } from './antivirus-manager/types';

type TProps = {
  filePath: string;
  database: DBScannerConnection;
  antivirus: AntivirusEngine;
};

export const scanFile = async ({ filePath, database, antivirus }: TProps) => {
  try {
    const scannedItem = await transformItem(filePath);
    const previousScannedItem = await database.getItemFromDatabase(scannedItem.pathName);

    if (previousScannedItem) {
      if (scannedItem.updatedAtW === previousScannedItem.updatedAtW) return;
      if (scannedItem.hash === previousScannedItem.hash) return;

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
  } catch {
    /**
     * v2.5.5 Daniel Jiménez
     * We cannot add the error because there are so many files with hashing problems
     * and it would be a lot of noise in the logs.
     */
    logger.error({
      tag: 'ANTIVIRUS',
      msg: 'Error scanning file',
      filePath,
    });
  }
};
