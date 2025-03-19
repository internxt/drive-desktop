import Logger from 'electron-log';
import { shell, BrowserWindow, ipcMain } from 'electron';
import { AntivirusIPCMain } from './AntivirusIPCMain';
import { SelectedItemToScanProps } from '../../main/antivirus/Antivirus';
import { PaymentsService } from '../../main/payments/service';
import { getManualScanMonitorInstance } from '../../main/antivirus/ManualSystemScan';
import { buildPaymentsService } from '../../main/payments/builder';
import { getMultiplePathsFromDialog } from '../../main/device/service';
import { ScanProgress } from './messages/BackgroundProcessMessages';
import fs from 'fs';

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
              Logger.info(
                `[Antivirus] Removing trailing slash from confirmed file path: ${itemPath}`
              );
              itemPath = pathToCheck;
            } else if (stats.isDirectory() && !itemPath.endsWith('/')) {
              Logger.info(
                `[Antivirus] Adding trailing slash to confirmed directory path: ${itemPath}`
              );
              itemPath = `${pathToCheck}/`;
            }
          } else {
            if (!item.isDirectory && itemPath.endsWith('/')) {
              Logger.info(
                `[Antivirus] Removing trailing slash based on metadata: ${itemPath}`
              );
              itemPath = itemPath.replace(/\/+$/, '');
            }
          }
        } catch (error) {
          if (!item.isDirectory && itemPath.endsWith('/')) {
            Logger.info(
              `[Antivirus] Removing trailing slash based on metadata (fallback): ${itemPath}`
            );
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
        Logger.error(
          '[Antivirus] Error getting scanner instance:',
          monitorError
        );
        throw new Error('Failed to initialize scanner');
      }

      if (isSystemScan) {
        Logger.info('[Antivirus] Starting full system scan');
      } else {
        Logger.info(`[Antivirus] Starting scan of ${itemsArray.length} items`);
      }

      let pathNames: string[] | undefined = undefined;

      if (!isSystemScan) {
        pathNames = this.normalizeScanPaths(itemsArray);
        Logger.info(`[Antivirus] Normalized paths: ${pathNames.length} items`);
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
        Logger.error(
          '[Antivirus] Error setting up progress tracking:',
          progressError
        );
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
        Logger.info('[Antivirus] Scan completed successfully');
      } catch (scanError) {
        Logger.error('[Antivirus] Error or timeout during scan:', scanError);
        throw scanError;
      }
    } catch (error) {
      Logger.error('[Antivirus] Error during scan process:', error);
      throw error;
    } finally {
      if (progressInterval) {
        try {
          clearInterval(progressInterval);
        } catch (clearError) {
          Logger.error('[Antivirus] Error clearing interval:', clearError);
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
          Logger.error(
            '[Antivirus] Error sending final progress callback:',
            callbackError
          );
        }
        Logger.info(
          '[Antivirus] Scan process finalized, progress callback sent'
        );
      } else {
        Logger.info('[Antivirus] System scan process continuing in background');
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

      Logger.info(
        `[Antivirus] Removing ${filesToRemove.length} infected files`
      );

      if (filesToRemove.length === 0) {
        Logger.info('[Antivirus] No infected files to remove');
        return true;
      }

      await Promise.all(
        filesToRemove.map(async (infectedFile: string) => {
          if (!infectedFile) {
            Logger.warn('[Antivirus] Invalid file path, skipping');
            return;
          }

          try {
            await shell.trashItem(infectedFile);
            Logger.info(`[Antivirus] Moved to trash: ${infectedFile}`);
          } catch (fileError) {
            Logger.error(
              `[Antivirus] Failed to trash file ${infectedFile}:`,
              fileError
            );
          }
        })
      );

      return true;
    } catch (error) {
      Logger.error('[Antivirus] Error removing infected files:', error);
      return false;
    }
  }
}

/**
 * Handles antivirus IPC messaging between main and renderer processes
 */
export class AntivirusIPCHandler {
  private paymentService: PaymentsService | null = null;

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
      if (!this.paymentService) {
        this.paymentService = buildPaymentsService();
      }

      try {
        const availableProducts =
          await this.paymentService.getAvailableProducts();
        return availableProducts.antivirus;
      } catch (error) {
        Logger.error('[Antivirus] Error getting products: ', error);
        throw error;
      }
    });
  }

  /**
   * Setup handler for canceling scan
   */
  private setupCancelScanHandler(): void {
    AntivirusIPCMain.handle('antivirus:cancel-scan', async () => {
      Logger.info('[Antivirus] Handler called: antivirus:cancel-scan');
      const fileSystemMonitor = await getManualScanMonitorInstance();
      await fileSystemMonitor.stopScan();
    });
  }

  /**
   * Setup handler for scanning items
   */
  private setupScanItemsHandler(): void {
    AntivirusIPCMain.handle('antivirus:scan-items', async (_, items = []) => {
      Logger.info('[Antivirus] Handler called: antivirus:scan-items');
      try {
        const itemsArray = Array.isArray(items) ? items : [];
        const isSystemScan = itemsArray.length === 0;

        Logger.info(
          `[Antivirus] Request for ${
            isSystemScan ? 'system' : 'custom'
          } scan received`
        );

        try {
          const fileSystemMonitor = await getManualScanMonitorInstance();
          await fileSystemMonitor.stopScan();
        } catch (stopError) {
          Logger.error('[Antivirus] Error stopping previous scan:', stopError);
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
            Logger.error('[Antivirus] Error in background system scan:', error);
          });

          Logger.info(
            '[Antivirus] System scan started in background, sending early success response'
          );
          return { success: true, inProgress: true };
        }

        return await Promise.race([
          (async () => {
            try {
              await AntivirusScanService.performScan(
                itemsArray,
                this.broadcastScanProgress.bind(this)
              );
              Logger.info(
                '[Antivirus] Scan completed, sending response to renderer'
              );
              return true;
            } catch (scanError) {
              Logger.error(
                '[Antivirus] Error during scan operation:',
                scanError
              );
              return false;
            }
          })(),
          new Promise((resolve) =>
            setTimeout(() => {
              Logger.warn(
                `[Antivirus] Scan operation timed out after ${
                  timeoutDuration / 60000
                } minutes, forcing response`
              );
              resolve(false);
            }, timeoutDuration)
          ),
        ]);
      } catch (error) {
        Logger.error('[Antivirus] Error in scan-items handler:', error);
        return false;
      }
    });
  }

  /**
   * Setup handler for adding items to scan
   */
  private setupAddItemsToScanHandler(): void {
    Logger.info(
      '[Antivirus] Registering handler for antivirus:add-items-to-scan'
    );
    ipcMain.handle('antivirus:add-items-to-scan', async (_, getFiles) => {
      try {
        Logger.info('[Antivirus] Handler called: antivirus:add-items-to-scan', {
          getFiles,
        });

        const shouldGetFiles = Boolean(getFiles);
        const result = await getMultiplePathsFromDialog(shouldGetFiles);

        if (!result || !Array.isArray(result)) {
          Logger.info('[Antivirus] No paths selected, returning empty array');
          return [];
        }

        Logger.info('[Antivirus] Selected paths:', result);
        return result;
      } catch (error) {
        Logger.error('[Antivirus] Error adding items to scan:', error);
        return [];
      }
    });
  }

  /**
   * Setup handler for removing infected files
   */
  private setupRemoveInfectedFilesHandler(): void {
    Logger.info(
      '[Antivirus] Registering handler for antivirus:remove-infected-files'
    );
    AntivirusIPCMain.handle(
      'antivirus:remove-infected-files',
      async (_, infectedFiles) => {
        try {
          Logger.info(
            '[Antivirus] Handler called: antivirus:remove-infected-files'
          );
          return await AntivirusScanService.removeInfectedFiles(infectedFiles);
        } catch (error) {
          Logger.error('[Antivirus] Error removing infected files:', error);
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
          Logger.info(`[Antivirus] Removing handler: ${name}`);
          ipcMain.removeHandler(name);
          AntivirusIPCMain.removeHandler(name);
        } catch (error) {
          Logger.warn(`[Antivirus] Error removing handler ${name}:`, error);
        }
      }

      ipcMain.removeAllListeners('antivirus:scan-progress');
      AntivirusIPCMain.removeAllListeners('antivirus:scan-progress');

      Logger.info('[Antivirus] All handlers removed');
    } catch (error) {
      Logger.error('[Antivirus] Error removing handlers:', error);
    }
  }
}
