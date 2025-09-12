import { logger } from '@internxt/drive-desktop-core/build/backend';
import { shell, BrowserWindow, ipcMain } from 'electron';
import { AntivirusIPCMain } from './AntivirusIPCMain';
import { SelectedItemToScanProps } from '../../main/antivirus/Antivirus';

import { getManualScanMonitorInstance } from '../../main/antivirus/ManualSystemScan';
import { getMultiplePathsFromDialog } from '../../main/device/service';
import { ScanProgress } from './messages/BackgroundProcessMessages';
import fs from 'fs';
import { getStoredUserProducts } from '../../../backend/features/payments/services/get-stored-user-products';

/**
 * Service class for handling antivirus scan operations
 */
export class AntivirusScanService {
  /**
   * Normalizes paths for scanning, ensuring proper formatting
   */
  public static normalizeScanPaths(items: SelectedItemToScanProps[]): string[] {
    return items
      .map((item: SelectedItemToScanProps) => {
        if (!item?.path) return '';

        let itemPath = item.path;

        try {
          const pathToCheck = itemPath.replace(/\/+$/, '');

          if (fs.existsSync(pathToCheck)) {
            const stats = fs.statSync(pathToCheck);

            if (stats.isFile() && itemPath.endsWith('/')) {
              logger.debug({
                tag: 'ANTIVIRUS',
                msg: `Removing trailing slash from confirmed file path: ${itemPath}`,
              });
              itemPath = pathToCheck;
            } else if (stats.isDirectory() && !itemPath.endsWith('/')) {
              logger.debug({
                tag: 'ANTIVIRUS',
                msg: `Adding trailing slash to confirmed directory path: ${itemPath}`,
              });
              itemPath = `${pathToCheck}/`;
            }
          } else {
            if (!item.isDirectory && itemPath.endsWith('/')) {
              logger.debug({
                tag: 'ANTIVIRUS',
                msg: `Removing trailing slash based on metadata: ${itemPath}`,
              });
              itemPath = itemPath.replace(/\/+$/, '');
            }
          }
        } catch (error) {
          if (!item.isDirectory && itemPath.endsWith('/')) {
            logger.debug({
              tag: 'ANTIVIRUS',
              msg: `Removing trailing slash based on metadata (fallback): ${itemPath}`,
            });
            itemPath = itemPath.replace(/\/+$/, '');
          }
        }

        return itemPath;
      })
      .filter(Boolean);
  }

  /**
   * Executes a scan on specified items
   */
  public static async performScan(
    itemsArray: any[],
    progressCallback: (progress: ScanProgress) => void
  ): Promise<void> {
    const isSystemScan = itemsArray.length === 0;
    let fileSystemMonitor = null;
    let progressInterval: NodeJS.Timeout | null = null;

    try {
      try {
        fileSystemMonitor = await getManualScanMonitorInstance();
      } catch (monitorError) {
        logger.error({
          tag: 'ANTIVIRUS',
          msg: 'Error getting scanner instance:',
          error: monitorError,
        });
        throw new Error('Failed to initialize scanner');
      }

      if (isSystemScan) {
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: 'Starting full system scan',
        });
      } else {
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: `Starting scan of ${itemsArray.length} items`,
        });
      }

      let pathNames: string[] | undefined = undefined;

      if (!isSystemScan) {
        pathNames = this.normalizeScanPaths(itemsArray);
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: `Normalized paths: ${pathNames.length} items`,
        });
      }

      try {
        if (!isSystemScan) {
          progressInterval = this.setupItemScanProgress(
            pathNames,
            progressCallback
          );
        } else {
          this.initializeSystemScanProgress(progressCallback);
        }
      } catch (progressError) {
        logger.error({
          tag: 'ANTIVIRUS',
          msg: 'Error setting up progress tracking:',
          error: progressError,
        });
      }

      const scanPromise = fileSystemMonitor.scanItems(
        isSystemScan ? undefined : pathNames
      );
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Scan timeout after 10 minutes'));
        }, 10 * 60 * 1000);
      });

      try {
        await Promise.race([scanPromise, timeoutPromise]);
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: 'Scan completed successfully',
        });
      } catch (scanError) {
        logger.error({
          tag: 'ANTIVIRUS',
          msg: 'Error or timeout during scan:',
          error: scanError,
        });
        throw scanError;
      }
    } catch (error) {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: 'Error during scan process:',
        error,
      });
      throw error;
    } finally {
      if (progressInterval) {
        try {
          clearInterval(progressInterval);
        } catch (clearError) {
          logger.error({
            tag: 'ANTIVIRUS',
            msg: 'Error clearing interval:',
            error: clearError,
          });
        }
      }

      if (!isSystemScan) {
        try {
          progressCallback({
            currentPath: undefined,
            scannedFiles: itemsArray.length || 0,
            progressRatio: 1,
            infected: [],
            isCompleted: true,
          });
        } catch (callbackError) {
          logger.error({
            tag: 'ANTIVIRUS',
            msg: 'Error sending final progress callback:',
            error: callbackError,
          });
        }
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: 'Scan process finalized, progress callback sent',
        });
      } else {
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: 'System scan process continuing in background',
        });
      }
    }
  }

  /**
   * Setup progress tracking for item scan
   */
  private static setupItemScanProgress(
    pathNames: string[] | undefined,
    progressCallback: (progress: ScanProgress) => void
  ): NodeJS.Timeout {
    let totalScanned = 0;
    const totalItems = pathNames?.length || 0;

    const progressInterval = setInterval(() => {
      totalScanned += 1;
      if (totalScanned > totalItems) {
        totalScanned = totalItems;
      }

      progressCallback({
        currentPath: 'Scanning...',
        scannedFiles: totalScanned,
        progressRatio: totalItems > 0 ? totalScanned / totalItems : 0,
        infected: [],
        isCompleted: totalScanned >= totalItems,
      });

      if (totalScanned >= totalItems) {
        clearInterval(progressInterval);
      }
    }, 1000);

    return progressInterval;
  }

  /**
   * Initialize progress tracking for system scan
   */
  private static initializeSystemScanProgress(
    progressCallback: (progress: ScanProgress) => void
  ): void {
    progressCallback({
      currentPath: 'Initializing system scan...',
      scannedFiles: 0,
      progressRatio: 0,
      infected: [],
      isCompleted: false,
    });
  }

  /**
   * Removes infected files by moving them to trash
   */
  public static async removeInfectedFiles(
    infectedFiles: string[]
  ): Promise<boolean> {
    try {
      const filesToRemove = Array.isArray(infectedFiles) ? infectedFiles : [];

      logger.debug({
        tag: 'ANTIVIRUS',
        msg: `Removing ${filesToRemove.length} infected files`,
      });

      if (filesToRemove.length === 0) {
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: 'No infected files to remove',
        });
        return true;
      }

      await Promise.all(
        filesToRemove.map(async (infectedFile: string) => {
          if (!infectedFile) {
            logger.warn({
              tag: 'ANTIVIRUS',
              msg: 'Invalid file path, skipping',
            });
            return;
          }

          try {
            await shell.trashItem(infectedFile);
            logger.debug({
              tag: 'ANTIVIRUS',
              msg: `Moved to trash: ${infectedFile}`,
            });
          } catch (fileError) {
            logger.error({
              tag: 'ANTIVIRUS',
              msg: `Failed to trash file ${infectedFile}:`,
              error: fileError,
            });
          }
        })
      );

      return true;
    } catch (error) {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: 'Error removing infected files:',
        error,
      });
      return false;
    }
  }
}

/**
 * Handles antivirus IPC messaging between main and renderer processes
 */
export class AntivirusIPCHandler {

  /**
   * Broadcast scan progress to all open windows
   */
  private broadcastScanProgress(progress: ScanProgress): void {
    const windows = BrowserWindow.getAllWindows();

    for (const window of windows) {
      if (!window.isDestroyed()) {
        window.webContents.send('antivirus:scan-progress', progress);
      }
    }
  }

  /**
   * Setup all IPC message handlers
   */
  public setupHandlers(): void {
    this.removeMessagesHandlers();
    this.addMessagesHandlers();
  }

  /**
   * Add all IPC message handlers
   */
  private addMessagesHandlers(): void {
    // Handle direct events
    this.setupDirectEventHandlers();

    // Register all handlers using AntivirusIPCMain to avoid duplicates
    this.setupAvailabilityHandler();
    this.setupCancelScanHandler();
    this.setupScanItemsHandler();
    this.setupAddItemsToScanHandler();
    this.setupRemoveInfectedFilesHandler();
  }

  /**
   * Setup handlers for direct events
   */
  private setupDirectEventHandlers(): void {
    ipcMain.on('antivirus:scan-progress', (_, progress) => {
      this.broadcastScanProgress(progress);
    });

    AntivirusIPCMain.on('antivirus:scan-progress', (_, progress) => {
      this.broadcastScanProgress(progress);
    });
  }

  /**
   * Setup handler for checking antivirus availability
   */
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

  /**
   * Setup handler for canceling scan
   */
  private setupCancelScanHandler(): void {
    AntivirusIPCMain.handle('antivirus:cancel-scan', async () => {
      logger.debug({
        tag: 'ANTIVIRUS',
        msg: 'Handler called: antivirus:cancel-scan',
      });
      const fileSystemMonitor = await getManualScanMonitorInstance();
      await fileSystemMonitor.stopScan();
    });
  }

  /**
   * Setup handler for scanning items
   */
  private setupScanItemsHandler(): void {
    AntivirusIPCMain.handle('antivirus:scan-items', async (_, items = []) => {
      logger.debug({
        tag: 'ANTIVIRUS',
        msg: 'Handler called: antivirus:scan-items',
      });
      try {
        const itemsArray = Array.isArray(items) ? items : [];
        const isSystemScan = itemsArray.length === 0;

        logger.debug({
          tag: 'ANTIVIRUS',
          msg: `Request for ${
            isSystemScan ? 'system' : 'custom'
          } scan received`,
        });

        try {
          const fileSystemMonitor = await getManualScanMonitorInstance();
          await fileSystemMonitor.stopScan();
        } catch (stopError) {
          logger.error({
            tag: 'ANTIVIRUS',
            msg: 'Error stopping previous scan:',
            error: stopError,
          });
        }

        // 1 hour for system scan, 10 mins for custom
        const timeoutDuration = isSystemScan ? 60 * 60 * 1000 : 10 * 60 * 1000;

        if (isSystemScan) {
          this.broadcastScanProgress({
            currentPath: 'Preparing system scan - counting files...',
            scannedFiles: 0,
            progressRatio: 0.02, // Show a small amount of progress (2%)
            infected: [],
            isCompleted: false,
          });

          AntivirusScanService.performScan(
            itemsArray,
            this.broadcastScanProgress.bind(this)
          ).catch((error) => {
            logger.error({
              tag: 'ANTIVIRUS',
              msg: 'Error in background system scan:',
              error,
            });
          });

          logger.debug({
            tag: 'ANTIVIRUS',
            msg: 'System scan started in background, sending early success response',
          });
          return { success: true, inProgress: true };
        }

        return await Promise.race([
          (async () => {
            try {
              await AntivirusScanService.performScan(
                itemsArray,
                this.broadcastScanProgress.bind(this)
              );
              logger.debug({
                tag: 'ANTIVIRUS',
                msg: 'Scan completed, sending response to renderer',
              });
              return true;
            } catch (scanError) {
              logger.error({
                tag: 'ANTIVIRUS',
                msg: 'Error during scan operation:',
                error: scanError,
              });
              return false;
            }
          })(),
          new Promise((resolve) =>
            setTimeout(() => {
              logger.warn({
                tag: 'ANTIVIRUS',
                msg: `Scan operation timed out after ${
                  timeoutDuration / 60000
                } minutes, forcing response`,
              });
              resolve(false);
            }, timeoutDuration)
          ),
        ]);
      } catch (error) {
        logger.error({
          tag: 'ANTIVIRUS',
          msg: 'Error in scan-items handler:',
          error,
        });
        return false;
      }
    });
  }

  /**
   * Setup handler for adding items to scan
   */
  private setupAddItemsToScanHandler(): void {
    logger.debug({
      tag: 'ANTIVIRUS',
      msg: 'Registering handler for antivirus:add-items-to-scan',
    });
    ipcMain.handle('antivirus:add-items-to-scan', async (_, getFiles) => {
      try {
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: 'Handler called: antivirus:add-items-to-scan',
          getFiles,
        });

        const shouldGetFiles = Boolean(getFiles);
        const result = await getMultiplePathsFromDialog(shouldGetFiles);

        if (!result || !Array.isArray(result)) {
          logger.debug({
            tag: 'ANTIVIRUS',
            msg: 'No paths selected, returning empty array',
          });
          return [];
        }

        logger.debug({
          tag: 'ANTIVIRUS',
          msg: 'Selected paths:',
          result,
        });
        return result;
      } catch (error) {
        logger.error({
          tag: 'ANTIVIRUS',
          msg: 'Error adding items to scan:',
          error,
        });
        return [];
      }
    });
  }

  /**
   * Setup handler for removing infected files
   */
  private setupRemoveInfectedFilesHandler(): void {
    logger.debug({
      tag: 'ANTIVIRUS',
      msg: 'Registering handler for antivirus:remove-infected-files',
    });
    AntivirusIPCMain.handle(
      'antivirus:remove-infected-files',
      async (_, infectedFiles) => {
        try {
          logger.debug({
            tag: 'ANTIVIRUS',
            msg: 'Handler called: antivirus:remove-infected-files',
          });
          return await AntivirusScanService.removeInfectedFiles(infectedFiles);
        } catch (error) {
          logger.error({
            tag: 'ANTIVIRUS',
            msg: 'Error removing infected files:',
            error,
          });
          return false;
        }
      }
    );
  }

  /**
   * Remove all IPC message handlers
   */
  public removeHandlers(): void {
    this.removeMessagesHandlers();
  }

  /**
   * Remove all IPC message handlers
   */
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
          logger.debug({
            tag: 'ANTIVIRUS',
            msg: `Removing handler: ${name}`,
          });
          ipcMain.removeHandler(name);
          AntivirusIPCMain.removeHandler(name);
        } catch (error) {
          logger.warn({
            tag: 'ANTIVIRUS',
            msg: `Error removing handler ${name}:`,
            error,
          });
        }
      }

      ipcMain.removeAllListeners('antivirus:scan-progress');
      AntivirusIPCMain.removeAllListeners('antivirus:scan-progress');

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
