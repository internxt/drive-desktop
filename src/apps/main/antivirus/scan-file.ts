import { logger } from '@/apps/shared/logger/logger';
import { Antivirus } from './Antivirus';
import { DBScannerConnection } from './utils/dbConections';
import { transformItem } from './utils/transformItem';

type TProps = {
  filePath: string;
  database: DBScannerConnection;
  antivirus: Antivirus;
};

export const scanFile = async ({ filePath, database, antivirus }: TProps) => {
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

    const currentScannedFile = await antivirus.scanFile(filePath);

    if (currentScannedFile) {
      await database.addItemToDatabase({
        ...scannedItem,
        isInfected: currentScannedFile.isInfected,
      });
    }
  } catch (error) {
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
