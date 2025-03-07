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
    // Handle direct events (keep this one)
    ipcMain.on('antivirus:scan-progress', (_, progress) => {
      this.broadcastScanProgress(progress);
    });

    // Register all handlers using AntivirusIPCMain to avoid duplicates
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

    AntivirusIPCMain.handle('antivirus:cancel-scan', async () => {
      Logger.info('[Antivirus] Handler called: antivirus:cancel-scan');
      const fileSystemMonitor = await getManualScanMonitorInstance();
      await fileSystemMonitor.stopScan();
    });

    AntivirusIPCMain.handle('antivirus:scan-items', async (_, items = []) => {
      Logger.info('[Antivirus] Handler called: antivirus:scan-items');

      const itemsArray = Array.isArray(items) ? items : [];

      const fileSystemMonitor = await getManualScanMonitorInstance();

      const isSystemScan = itemsArray.length === 0;

      if (isSystemScan) {
        Logger.info('[Antivirus] Starting full system scan');
      } else {
        Logger.info(`[Antivirus] Starting scan of ${itemsArray.length} items`);
      }

      let pathNames: string[] | undefined = undefined;

      if (!isSystemScan) {
        pathNames = itemsArray
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

      let progressInterval: NodeJS.Timeout | null = null;

      if (!isSystemScan) {
        let totalScanned = 0;
        const totalItems = pathNames?.length || 0;

        progressInterval = setInterval(() => {
          totalScanned += 1;
          if (totalScanned > totalItems) {
            totalScanned = totalItems;
          }

          this.broadcastScanProgress({
            currentPath: 'Scanning...',
            scannedFiles: totalScanned,
            progressRatio: totalItems > 0 ? totalScanned / totalItems : 0,
            infected: [],
            isCompleted: totalScanned >= totalItems,
          });

          if (totalScanned >= totalItems) {
            clearInterval(progressInterval!);
          }
        }, 1000);
      } else {
        this.broadcastScanProgress({
          currentPath: 'Initializing system scan...',
          scannedFiles: 0,
          progressRatio: 0,
          infected: [],
          isCompleted: false,
        });
      }

      try {
        await fileSystemMonitor.scanItems(isSystemScan ? undefined : pathNames);

        if (progressInterval) {
          clearInterval(progressInterval);
        }

        this.broadcastScanProgress({
          currentPath: undefined,
          scannedFiles: isSystemScan ? 100 : pathNames?.length || 0,
          progressRatio: 1,
          infected: [],
          isCompleted: true,
        });

        return;
      } catch (error) {
        Logger.error('[Antivirus] Error during scan:', error);

        if (progressInterval) {
          clearInterval(progressInterval);
        }

        this.broadcastScanProgress({
          currentPath: undefined,
          scannedFiles: isSystemScan ? 100 : pathNames?.length || 0,
          progressRatio: 1,
          infected: [],
          isCompleted: true,
        });

        throw error;
      }
    });

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

          const filesToRemove = Array.isArray(infectedFiles)
            ? infectedFiles
            : [];

          Logger.info(
            `[Antivirus] Removing ${filesToRemove.length} infected files`
          );

          if (filesToRemove.length === 0) {
            Logger.info('[Antivirus] No infected files to remove');
            return;
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
    );

    AntivirusIPCMain.on('antivirus:scan-progress', (_, progress) => {
      this.broadcastScanProgress(progress);
    });
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
