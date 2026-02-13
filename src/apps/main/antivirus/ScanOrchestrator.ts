import { queue, QueueObject } from 'async';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Antivirus } from './Antivirus';
import { ScanProgressReporter } from './ScanProgressReporter';
import { DBScannerConnection } from './db/DBScannerConnection';
import { ScannedItemCollection } from '../database/collections/ScannedItemCollection';
import { countSystemFiles, getFilesFromDirectory } from './utils/getFilesFromDirectory';
import { transformItem } from './utils/transformItem';
import { isPermissionError } from './utils/isPermissionError';
import { ScannedItem } from '../database/entities/ScannedItem';

export class ScanOrchestrator {
  private antivirus: Antivirus | null = null;
  private scanQueue: QueueObject<string> | null = null;
  private progressReporter: ScanProgressReporter | null = null;
  private dbConnection: DBScannerConnection;
  private abortController: AbortController;

  constructor() {
    const scannedItemsAdapter = new ScannedItemCollection();
    this.dbConnection = new DBScannerConnection(scannedItemsAdapter);
    this.abortController = new AbortController();
  }

  async scanPaths(paths: string[]) {
    if (paths.length === 0) {
      logger.warn({ tag: 'ANTIVIRUS', msg: 'No paths provided for scanning' });
      return;
    }

    logger.debug({
      tag: 'ANTIVIRUS',
      msg: `Starting scan of ${paths.length} path(s)`,
    });

    try {
      this.antivirus = await Antivirus.createInstance();
      const totalFiles = await this.countTotalFiles(paths);

      if (totalFiles === 0) {
        logger.debug({ tag: 'ANTIVIRUS', msg: 'No files to scan' });
        this.emitEmptyResult();
        return;
      }

      logger.debug({
        tag: 'ANTIVIRUS',
        msg: `Total files to scan: ${totalFiles}`,
      });

      this.progressReporter = new ScanProgressReporter(totalFiles);

      this.scanQueue = queue(async (filePath: string) => {
        return await this.scanFile(filePath);
      }, 10);

      logger.debug({
        tag: 'ANTIVIRUS',
        msg: 'Queue created, starting to queue files...',
      });

      await this.queueFilesForScanning(paths);

      logger.debug({
        tag: 'ANTIVIRUS',
        msg: `All files queued (${this.scanQueue.length()} in queue, ${this.scanQueue.running()} running). Waiting for completion...`,
      });

      await Promise.race([
        this.scanQueue.drain(),
        new Promise<void>((resolve) => {
          this.abortController.signal.addEventListener('abort', () => resolve());
        }),
      ]);

      if (this.abortController.signal.aborted) {
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: 'Scan was cancelled',
        });
        return;
      }

      logger.debug({
        tag: 'ANTIVIRUS',
        msg: 'Queue drained, scan completed',
      });

      if (this.progressReporter) {
        this.progressReporter.reportCompleted();

        logger.debug({
          tag: 'ANTIVIRUS',
          msg: `Scan completed: ${this.progressReporter.getProgress().scannedFiles} files scanned, ${this.progressReporter.getProgress().infectedFiles.length} infected`,
        });
      }
    } catch (error) {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: 'Error during scan:',
        error,
      });
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async cancel() {
    logger.debug({ tag: 'ANTIVIRUS', msg: 'Cancelling scan...' });

    this.abortController.abort();

    if (this.scanQueue) {
      this.scanQueue.kill();
      logger.debug({
        tag: 'ANTIVIRUS',
        msg: `Queue killed. Remaining in queue: ${this.scanQueue.length()}, Running workers: ${this.scanQueue.running()}`,
      });
    }

    if (this.progressReporter) {
      this.progressReporter.reportCompleted();
    }

    await this.cleanup();
    logger.debug({ tag: 'ANTIVIRUS', msg: 'Scan cancellation completed' });
  }

  private async countTotalFiles(paths: string[]) {
    let total = 0;

    for (const path of paths) {
      try {
        total += await countSystemFiles(path);
      } catch (error) {
        if (!isPermissionError(error)) {
          logger.error({
            tag: 'ANTIVIRUS',
            msg: `Error counting files in ${path}:`,
            error,
          });
        }
      }
    }

    return total;
  }

  private async queueFilesForScanning(paths: string[]) {
    let queuedCount = 0;

    for (const path of paths) {
      if (this.abortController.signal.aborted) break;

      logger.debug({
        tag: 'ANTIVIRUS',
        msg: `Queueing files from path: ${path}`,
      });

      await getFilesFromDirectory({
        dir: path,
        cb: async (filePath: string) => {
          if (this.scanQueue) {
            this.scanQueue.push(filePath);
            queuedCount++;
            if (queuedCount % 1000 === 0) {
              logger.debug({
                tag: 'ANTIVIRUS',
                msg: `Queued ${queuedCount} files so far (queue: ${this.scanQueue.length()}, running: ${this.scanQueue.running()})`,
              });
            }
          }
        },
        signal: this.abortController.signal,
      });
    }

    logger.debug({
      tag: 'ANTIVIRUS',
      msg: `Finished queueing ${queuedCount} files. Queue length: ${this.scanQueue?.length() || 0}, Running: ${this.scanQueue?.running() || 0}`,
    });
  }

  private async scanFile(filePath: string) {
    if (this.abortController.signal.aborted || !this.antivirus || !this.progressReporter) {
      return;
    }

    try {
      const scannedItem = await transformItem(filePath);

      const cachedItem = await this.dbConnection.getItemFromDatabase(scannedItem.pathName);

      if (cachedItem && this.isFileUnchanged(scannedItem, cachedItem)) {
        if (!this.progressReporter) return;

        this.progressReporter.reportFileScanned(filePath, cachedItem.isInfected);
        return;
      }

      const scanResult = await this.antivirus.scanFileWithRetry(scannedItem.pathName, this.abortController.signal);

      if (scanResult) {
        const isInfected = scanResult.isInfected;

        await this.dbConnection.addItemToDatabase({
          ...scannedItem,
          isInfected,
        });

        if (!this.progressReporter) return;

        this.progressReporter.reportFileScanned(filePath, isInfected);
      }
    } catch (error) {
      if (!isPermissionError(error)) {
        logger.error({
          tag: 'ANTIVIRUS',
          msg: `Error scanning file ${filePath}:`,
          error,
        });
      }

      if (this.progressReporter) {
        this.progressReporter.reportFileScanned(filePath, false);
      }
    }
  }

  private isFileUnchanged(current: ScannedItem, cached: ScannedItem) {
    return current.updatedAtW === cached.updatedAtW || current.hash === cached.hash;
  }

  private emitEmptyResult() {
    const reporter = new ScanProgressReporter(0);
    reporter.reportCompleted();
  }

  private async cleanup() {
    if (this.antivirus) {
      try {
        await this.antivirus.stopClamAv();
      } catch (error) {
        logger.error({
          tag: 'ANTIVIRUS',
          msg: 'Error stopping ClamAV:',
          error,
        });
      }
      this.antivirus = null;
    }

    this.scanQueue = null;
    this.progressReporter = null;
  }
}
