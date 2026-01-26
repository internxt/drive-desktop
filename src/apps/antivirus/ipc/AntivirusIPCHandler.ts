import { logger } from '@internxt/drive-desktop-core/build/backend';
import { ipcMain } from 'electron';
import { AntivirusIPCMain } from './AntivirusIPCMain';
import { getMultiplePathsFromDialog } from '../../main/device/service';
import { getStoredUserProducts } from '../../../backend/features/payments/services/get-stored-user-products';
import { AntivirusScanService } from '../../main/antivirus/AntivirusScanService';

export class AntivirusIPCHandler {
  public setupHandlers(): void {
    this.removeMessagesHandlers();
    this.addMessagesHandlers();
  }

  private addMessagesHandlers(): void {
    this.setupAvailabilityHandler();
    this.setupCancelScanHandler();
    this.setupScanItemsHandler();
    this.setupAddItemsToScanHandler();
    this.setupRemoveInfectedFilesHandler();
  }

  private setupAvailabilityHandler(): void {
    AntivirusIPCMain.handle('antivirus:is-available', async () => {
      try {
        const availableProducts = getStoredUserProducts();
        return !!availableProducts?.antivirus;
      } catch (error) {
        logger.error({
          tag: 'ANTIVIRUS',
          msg: 'Error getting products: ',
          error,
        });
        throw error;
      }
    });
  }

  private setupCancelScanHandler(): void {
    AntivirusIPCMain.handle('antivirus:cancel-scan', async () => {
      logger.debug({ tag: 'ANTIVIRUS', msg: 'Cancelling scan' });
      await AntivirusScanService.cancelScan();
    });
  }

  private setupScanItemsHandler(): void {
    AntivirusIPCMain.handle('antivirus:scan-items', async (_, items = []) => {
      const itemsArray = Array.isArray(items) ? items : [];
      const isSystemScan = itemsArray.length === 0;

      logger.debug({
        tag: 'ANTIVIRUS',
        msg: `Starting ${isSystemScan ? 'system' : 'custom'} scan`,
      });

      try {
        await AntivirusScanService.performScan(itemsArray);
        return true;
      } catch (error) {
        logger.error({
          tag: 'ANTIVIRUS',
          msg: 'Scan failed:',
          error,
        });
        return false;
      }
    });
  }

  private setupAddItemsToScanHandler(): void {
    ipcMain.handle('antivirus:add-items-to-scan', async (_, getFiles) => {
      try {
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: `Opening file dialog for ${getFiles ? 'files' : 'folders'}`,
        });

        const shouldGetFiles = Boolean(getFiles);
        const result = await getMultiplePathsFromDialog(shouldGetFiles);

        if (!result || !Array.isArray(result)) {
          return [];
        }

        logger.debug({
          tag: 'ANTIVIRUS',
          msg: `Selected ${result.length} path(s)`,
        });

        return result;
      } catch (error) {
        logger.error({
          tag: 'ANTIVIRUS',
          msg: 'Error selecting paths:',
          error,
        });
        return [];
      }
    });
  }

  private setupRemoveInfectedFilesHandler(): void {
    AntivirusIPCMain.handle('antivirus:remove-infected-files', async (_, infectedFiles) => {
      try {
        return await AntivirusScanService.removeInfectedFiles(infectedFiles);
      } catch (error) {
        logger.error({
          tag: 'ANTIVIRUS',
          msg: 'Error removing infected files:',
          error,
        });
        return false;
      }
    });
  }

  public removeHandlers(): void {
    this.removeMessagesHandlers();
  }

  private removeMessagesHandlers(): void {
    try {
      const handlerNames = [
        'antivirus:is-available',
        'antivirus:cancel-scan',
        'antivirus:scan-items',
        'antivirus:add-items-to-scan',
        'antivirus:remove-infected-files',
      ] as const;

      for (const name of handlerNames) {
        try {
          ipcMain.removeHandler(name);
          AntivirusIPCMain.removeHandler(name);
        } catch (error) {
          continue;
        }
      }

      logger.debug({
        tag: 'ANTIVIRUS',
        msg: 'All Antivirus handlers removed',
      });
    } catch (error) {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: 'Error removing Antivirus handlers:',
        error,
      });
    }
  }
}
