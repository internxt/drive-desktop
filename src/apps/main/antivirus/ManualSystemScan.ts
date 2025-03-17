/* eslint-disable max-len */
import { ScannedItem } from '../database/entities/ScannedItem';
import { getUserSystemPath } from '../device/service';
import { queue, QueueObject } from 'async';
import eventBus from '../event-bus';
import { Antivirus } from './Antivirus';
import {
  countSystemFiles,
  getFilesFromDirectory,
} from './utils/getFilesFromDirectory';
import { transformItem } from './utils/transformItem';
import { isPermissionError } from './utils/isPermissionError';
import { DBScannerConnection } from './db/DBScannerConnection';
import { ScannedItemCollection } from '../database/collections/ScannedItemCollection';
import Logger from 'electron-log';
import { AppDataSource } from '../database/data-source';

export interface ProgressData {
  totalScannedFiles: number;
  infectedFiles: string[];
  currentScanPath: string;
  progress: number;
  done?: boolean;
  scanId?: string;
}

interface IntervalHandle {
  interval: NodeJS.Timeout;
  name: string;
}

let fileSystemMonitorInstanceManual: ManualSystemScan | null = null;

export async function getManualScanMonitorInstance() {
  if (!fileSystemMonitorInstanceManual) {
    fileSystemMonitorInstanceManual = new ManualSystemScan();
  }
  return fileSystemMonitorInstanceManual;
}

export class ManualSystemScan {
  private dbConnection: DBScannerConnection;
  private manualQueue: QueueObject<string> | null;
  private progressEvents: ProgressData[];
  private totalScannedFiles: number;
  private totalInfectedFiles: number;
  private infectedFiles: string[];
  private totalItemsToScan: number;
  private cancelled = false;
  private scanSessionId = 0;
  private errorCount = 0;
  private intervals: IntervalHandle[] = [];

  private antivirus: Antivirus | null;

  constructor() {
    this.progressEvents = [];
    this.manualQueue = null;
    this.totalScannedFiles = 0;
    this.totalInfectedFiles = 0;
    this.infectedFiles = [];
    this.totalItemsToScan = 0;
    this.antivirus = null;
    this.cancelled = false;
    this.scanSessionId = 1;
    this.errorCount = 0;
    this.intervals = [];
    const scannedItemsAdapter = new ScannedItemCollection();
    this.dbConnection = new DBScannerConnection(scannedItemsAdapter);
  }

  /**
   * Create and emit a progress event to update scan status
   */
  private emitProgressEvent(
    data: Partial<ProgressData>,
    sessionId?: number,
    emitNow = true
  ): ProgressData {
    const progressEvent: ProgressData = {
      currentScanPath: data.currentScanPath || 'Scanning...',
      infectedFiles: data.infectedFiles || this.infectedFiles,
      progress:
        data.progress !== undefined ? data.progress : this.calculateProgress(),
      totalScannedFiles:
        data.totalScannedFiles !== undefined
          ? data.totalScannedFiles
          : this.totalScannedFiles,
      scanId:
        data.scanId ||
        (sessionId ? `scan-${sessionId}` : `scan-${this.scanSessionId}`),
      done: data.done || false,
    };

    this.progressEvents.push(progressEvent);

    if (emitNow) {
      eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', { ...progressEvent });
    }

    return progressEvent;
  }

  /**
   * Calculate progress percentage based on scanned files vs total items
   */
  private calculateProgress(): number {
    if (this.totalItemsToScan <= 0) {
      return 50;
    }

    if (this.totalScannedFiles >= this.totalItemsToScan) {
      return 100;
    }

    return Math.min(
      Math.floor((this.totalScannedFiles / this.totalItemsToScan) * 99),
      99
    );
  }

  /**
   * Emit a final completion event, with optional delay
   */
  private emitCompletionEvent(
    message = 'Scan completed',
    delay = 0,
    sessionId?: string
  ): void {
    const finalEvent: ProgressData = {
      currentScanPath: message,
      infectedFiles: this.infectedFiles,
      progress: 100,
      totalScannedFiles: this.totalScannedFiles,
      done: true,
      scanId: sessionId || `scan-complete-${Date.now()}`,
    };

    eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', finalEvent);

    if (delay > 0) {
      setTimeout(() => {
        eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', finalEvent);
      }, delay);
    }
  }

  /**
   * Emit an error event
   */
  private emitErrorEvent(errorMessage: string, sessionId?: string): void {
    const errorEvent: ProgressData = {
      currentScanPath: errorMessage,
      infectedFiles: this.infectedFiles,
      progress: 100,
      totalScannedFiles: this.totalScannedFiles,
      done: true,
      scanId: sessionId || `scan-error-${Date.now()}`,
    };

    eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', errorEvent);
  }

  /**
   * Set up an interval and track it for cleanup
   */
  private createInterval(
    callback: () => void,
    delay: number,
    name: string
  ): IntervalHandle {
    const interval = setInterval(callback, delay);
    const handle = { interval, name };
    this.intervals.push(handle);
    return handle;
  }

  /**
   * Clear a specific interval and remove from tracking
   */
  private clearInterval(intervalHandle: IntervalHandle | null): void {
    if (!intervalHandle) return;

    clearInterval(intervalHandle.interval);
    this.intervals = this.intervals.filter(
      (h) => h.interval !== intervalHandle.interval
    );
  }

  /**
   * Clear all tracked intervals
   */
  private clearAllIntervals(): void {
    this.intervals.forEach((handle) => {
      clearInterval(handle.interval);
    });
    this.intervals = [];
  }

  /**
   * Check if scan appears to be completed based on processed files
   */
  private isScanComplete(): boolean {
    return (
      this.totalItemsToScan > 0 &&
      this.totalScannedFiles >= this.totalItemsToScan
    );
  }

  /**
   * Check if scan is nearly complete based on progress percentage
   */
  private isNearlyScanComplete(): boolean {
    if (this.totalItemsToScan <= 0) return false;

    const totalProcessed = this.totalScannedFiles + this.errorCount;
    const percentComplete = (totalProcessed / this.totalItemsToScan) * 100;

    return (
      percentComplete >= 99.5 || this.totalItemsToScan - totalProcessed <= 5
    );
  }

  /**
   * Check if a scan is stalled and handle accordingly
   */
  private handleStalledScan(
    lastCount: number,
    currentSession: number,
    stuckCheckCount: number,
    hasReportedError: boolean,
    scanCompleted: boolean,
    isCustomScan: boolean
  ): {
    stuckCount: number;
    hasError: boolean;
    isComplete: boolean;
    shouldContinue: boolean;
  } {
    let newStuckCount = stuckCheckCount;
    let newHasError = hasReportedError;
    let newIsComplete = scanCompleted;
    let shouldContinue = true;

    if (this.totalScannedFiles === lastCount) {
      newStuckCount++;

      if (newStuckCount >= 5) {
        const isNearlyScanComplete = this.isNearlyScanComplete();

        if (isNearlyScanComplete) {
          Logger.warn(
            `[SYSTEM_SCAN] Scan appears stuck at ${this.totalScannedFiles}/${this.totalItemsToScan} files. ` +
              `With ${this.errorCount} errors, total processed: ${
                this.totalScannedFiles + this.errorCount
              }/${this.totalItemsToScan}. ` +
              'Forcing completion.'
          );

          if (!scanCompleted && !hasReportedError) {
            this.emitCompletionEvent(
              `Scan completed with ${this.errorCount} errors`,
              0,
              `scan-complete-${Date.now()}`
            );

            newIsComplete = true;
            shouldContinue = false;
          }
        } else if (isCustomScan && !hasReportedError) {
          Logger.warn(
            '[SYSTEM_SCAN] Custom scan appears stuck, triggering safety timeout'
          );
          this.cancelled = true;

          this.emitErrorEvent(
            'Scan appears stuck - no progress detected for 10 minutes',
            `scan-stalled-${Date.now()}`
          );
          newHasError = true;
        }
      }
    } else {
      newStuckCount = 0;
    }

    return {
      stuckCount: newStuckCount,
      hasError: newHasError,
      isComplete: newIsComplete,
      shouldContinue,
    };
  }

  /**
   * Wait for active scans to complete or timeout
   */
  private async waitForActiveScans(activeScans: number): Promise<void> {
    const maxWaitTime = 30000;
    const startTime = Date.now();

    while (activeScans > 0) {
      if (this.isNearlyScanComplete()) {
        Logger.info(
          `[SYSTEM_SCAN] Processed ${(
            ((this.totalScannedFiles + this.errorCount) /
              this.totalItemsToScan) *
            100
          ).toFixed(
            2
          )}% of files, continuing despite ${activeScans} active scans`
        );
        break;
      }

      if (Date.now() - startTime > maxWaitTime) {
        Logger.warn(
          `[SYSTEM_SCAN] Timed out waiting for ${activeScans} active scans to complete`
        );
        break;
      }

      Logger.debug(
        `[SYSTEM_SCAN] Waiting for ${activeScans} active scans to complete...`
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  trackProgress = (
    currentSession: number,
    data: { file: string; isInfected: boolean }
  ) => {
    if (currentSession !== this.scanSessionId) return;
    const { file, isInfected } = data;

    if (isInfected) {
      this.infectedFiles.push(file);
      this.totalInfectedFiles++;
    }

    this.totalScannedFiles++;

    if (isInfected || this.totalScannedFiles % 1000 === 0) {
      Logger.info(
        `[SYSTEM_SCAN] Progress: ${this.calculateProgress()}%, Scanned: ${
          this.totalScannedFiles
        }/${this.totalItemsToScan}, Infected: ${this.totalInfectedFiles}`
      );
    }

    const shouldEmitNow = isInfected;

    const progressEvent = this.emitProgressEvent(
      {
        currentScanPath: file,
        scanId: `scan-${currentSession}`,
      },
      currentSession,
      shouldEmitNow
    );

    if (
      this.calculateProgress() === 100 &&
      this.totalScannedFiles >= this.totalItemsToScan
    ) {
      progressEvent.done = true;

      setTimeout(() => {
        const finalEvent: ProgressData = {
          ...progressEvent,
          done: true,
        };
        eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', finalEvent);
      }, 1000);
    }
  };

  private clearAntivirus = async () => {
    if (this.antivirus) {
      try {
        await this.antivirus.stopClamAv();
        this.antivirus = null;
      } catch (error) {
        Logger.error('[SYSTEM_SCAN] Error stopping ClamAV:', error);
        this.antivirus = null;
      }
    }
  };

  public stopScan = async () => {
    Logger.info('[SYSTEM_SCAN] Stopping scan...');
    this.cancelled = true;
    this.scanSessionId++;
    if (this.manualQueue) {
      this.manualQueue.kill();
    }

    try {
      await this.clearAntivirus();
    } catch (error) {
      Logger.error(
        '[SYSTEM_SCAN] Error clearing antivirus during stop:',
        error
      );
    }

    await this.resetCounters();
    Logger.info('[SYSTEM_SCAN] Scan stopped successfully');
  };

  private async resetCounters() {
    Logger.info('[SYSTEM_SCAN] Resetting scan counters and state');

    this.totalScannedFiles = 0;
    this.totalInfectedFiles = 0;
    this.infectedFiles = [];
    this.progressEvents = [];
    this.totalItemsToScan = 0;
    this.errorCount = 0;
    this.cancelled = false;

    this.clearAllIntervals();

    if (this.manualQueue) {
      try {
        this.manualQueue.kill();
        this.manualQueue = null;
      } catch (error) {
        Logger.error('[SYSTEM_SCAN] Error killing previous queue:', error);
      }
    }

    try {
      await this.clearAntivirus();
    } catch (error) {
      Logger.error(
        '[SYSTEM_SCAN] Error clearing Antivirus during reset:',
        error
      );
    }
  }

  private handlePreviousScannedItem = async (
    currentSession: number,
    scannedItem: ScannedItem,
    previousScannedItem: ScannedItem
  ) => {
    if (currentSession !== this.scanSessionId) return;

    if (
      scannedItem.updatedAtW === previousScannedItem.updatedAtW ||
      scannedItem.hash === previousScannedItem.hash
    ) {
      this.trackProgress(currentSession, {
        file: previousScannedItem.pathName,
        isInfected: previousScannedItem.isInfected,
      });
    }
  };

  private async performCustomScan(
    currentSession: number,
    pathNames: string[],
    scan: (filePath: string) => Promise<void>
  ): Promise<void> {
    Logger.info('[SYSTEM_SCAN] Starting custom scan with selected paths');
    const pathsToScan: string[] = pathNames;

    this.manualQueue = queue(scan, 10);

    let total = 0;
    for (const p of pathNames) {
      try {
        total += await countSystemFiles(p);
      } catch (error) {
        Logger.error(`[SYSTEM_SCAN] Error counting files in path ${p}:`, error);
      }
    }

    this.totalItemsToScan = total;
    Logger.info(`[SYSTEM_SCAN] Total files to scan: ${total}`);

    if (total === 0) {
      this.emitEmptyDirProgressEvent(pathNames.join(', '), currentSession);
      return;
    }

    for (const p of pathsToScan) {
      await getFilesFromDirectory(
        p,
        (filePath: string) => this.manualQueue!.pushAsync(filePath),
        () => this.cancelled
      );
    }
  }

  private async performFullSystemScan(
    currentSession: number,
    scan: (filePath: string) => Promise<void>
  ): Promise<void> {
    Logger.info('[SYSTEM_SCAN] Starting full system scan');

    const userSystemPath = await getUserSystemPath();
    if (!userSystemPath) {
      Logger.error('[SYSTEM_SCAN] Could not get user system path');
      return;
    }

    Logger.info(`[SYSTEM_SCAN] Using user system path: ${userSystemPath.path}`);

    this.manualQueue = queue(scan, 10);

    try {
      const total = await countSystemFiles(userSystemPath.path);
      this.totalItemsToScan = total;

      Logger.info(`[SYSTEM_SCAN] Total system files to scan: ${total}`);

      this.emitProgressEvent(
        {
          currentScanPath: 'Scanning your system...',
          progress: 0,
          scanId: `scan-${currentSession}`,
        },
        currentSession
      );

      if (total === 0) {
        this.emitEmptyDirProgressEvent(userSystemPath.path, currentSession);
        return;
      }

      await getFilesFromDirectory(
        userSystemPath.path,
        (filePath: string) => this.manualQueue!.pushAsync(filePath),
        () => this.cancelled
      );
    } catch (error) {
      Logger.error('[SYSTEM_SCAN] Error in system scan process:', error);
      throw error;
    }
  }

  /**
   * Scan a single file and handle errors
   */
  private createScanHandler(
    antivirus: Antivirus,
    currentSession: number,
    activeScans: { count: number },
    maxToleratedErrors: number,
    hasReportedError: { value: boolean }
  ): (filePath: string) => Promise<void> {
    return async (filePath: string) => {
      if (this.cancelled) return;

      activeScans.count++;
      try {
        const scannedItem = await transformItem(filePath);
        const previousScannedItem = await this.dbConnection.getItemFromDatabase(
          scannedItem.pathName
        );

        if (previousScannedItem) {
          activeScans.count--;
          return this.handlePreviousScannedItem(
            currentSession,
            scannedItem,
            previousScannedItem
          );
        }

        try {
          const currentScannedFile = await antivirus.scanFileWithRetry(
            scannedItem.pathName
          );

          if (currentScannedFile) {
            await this.dbConnection.addItemToDatabase({
              ...scannedItem,
              isInfected: currentScannedFile.isInfected,
            });

            this.trackProgress(currentSession, {
              file: currentScannedFile.file,
              isInfected: currentScannedFile.isInfected,
            });
          }
        } catch (error) {
          this.errorCount++;
          Logger.error(
            `[SYSTEM_SCAN] Error scanning file ${scannedItem.pathName}:`,
            error
          );

          if (this.errorCount > maxToleratedErrors && !hasReportedError.value) {
            hasReportedError.value = true;
            this.emitErrorEvent(
              `Error: Too many scan failures (${this.errorCount} files failed)`,
              `scan-error-${currentSession}`
            );
          } else {
            this.trackProgress(currentSession, {
              file: `${scannedItem.pathName} (scan error)`,
              isInfected: false,
            });
          }

          if (!isPermissionError(error)) {
            Logger.warn(
              `[SYSTEM_SCAN] Continuing scan despite error with file: ${scannedItem.pathName}`
            );
          }
        }
      } catch (error) {
        this.errorCount++;
        if (!isPermissionError(error)) {
          Logger.error(
            `[SYSTEM_SCAN] Error processing file ${filePath}:`,
            error
          );
        }
      } finally {
        activeScans.count--;
      }
    };
  }

  /**
   * Setup progress monitoring intervals
   */
  private setupMonitoringIntervals(
    currentSession: number,
    scanState: {
      lastProgressCount: number;
      lastScannedCount: number;
      noProgressIntervals: number;
      stuckScanCheckCount: number;
      hasReportedError: boolean;
      scanCompleted: boolean;
      allFilesScanned: boolean;
      activeScans: { count: number };
    },
    isCustomScan: boolean
  ): {
    progressCheck: IntervalHandle;
    heartbeat: IntervalHandle;
    reportProgress: IntervalHandle;
  } {
    const progressCheckInterval = this.createInterval(
      () => {
        if (!scanState.scanCompleted && !this.cancelled) {
          if (this.totalScannedFiles === scanState.lastProgressCount) {
            scanState.noProgressIntervals++;
            Logger.debug(
              `[SYSTEM_SCAN] No progress for ${
                scanState.noProgressIntervals
              } intervals (${scanState.noProgressIntervals / 2} minutes)`
            );

            if (scanState.noProgressIntervals >= 20) {
              Logger.warn(
                `[SYSTEM_SCAN] No progress detected for ~${
                  scanState.noProgressIntervals / 2
                } minutes: ` +
                  `${this.totalScannedFiles}/${this.totalItemsToScan} files scanned. ` +
                  'Scan appears stalled but will continue.'
              );

              if (isCustomScan && !scanState.hasReportedError) {
                Logger.warn(
                  '[SYSTEM_SCAN] Custom scan appears stuck, triggering safety timeout'
                );
                this.cancelled = true;

                this.emitErrorEvent(
                  'Scan appears stuck - no progress detected for 10 minutes',
                  `scan-stalled-${Date.now()}`
                );
                scanState.hasReportedError = true;
              }

              scanState.noProgressIntervals = 15;
            }
          } else {
            scanState.noProgressIntervals = 0;
            scanState.lastProgressCount = this.totalScannedFiles;
          }
        } else {
          this.clearInterval(progressCheckInterval);
        }
      },
      30000,
      'progressCheck'
    );

    const heartbeatInterval = this.createInterval(
      () => {
        if (!this.cancelled && !scanState.scanCompleted) {
          if (this.isScanComplete()) {
            Logger.info(
              `[SYSTEM_SCAN] All files scanned (${this.totalScannedFiles}/${this.totalItemsToScan}). Stopping heartbeat.`
            );

            if (!scanState.scanCompleted && !scanState.hasReportedError) {
              this.emitCompletionEvent(
                `Scan completed with ${this.errorCount} errors`,
                0,
                `scan-complete-${Date.now()}`
              );

              scanState.scanCompleted = true;
              this.clearInterval(heartbeatInterval);
              return;
            }
          }

          const stuckResult = this.handleStalledScan(
            scanState.lastScannedCount,
            currentSession,
            scanState.stuckScanCheckCount,
            scanState.hasReportedError,
            scanState.scanCompleted,
            isCustomScan
          );

          scanState.stuckScanCheckCount = stuckResult.stuckCount;
          scanState.hasReportedError = stuckResult.hasError;
          scanState.scanCompleted = stuckResult.isComplete;

          if (!stuckResult.shouldContinue) {
            this.clearInterval(heartbeatInterval);
            return;
          }

          scanState.lastScannedCount = this.totalScannedFiles;

          this.emitProgressEvent(
            {
              currentScanPath: `Scanning in progress... (${
                this.totalScannedFiles
              }/${this.totalItemsToScan || 'calculating'})`,
              progress: this.calculateProgress(),
              scanId: `scan-${currentSession}-heartbeat`,
            },
            currentSession
          );

          Logger.debug(
            `[SYSTEM_SCAN] Heartbeat: ${this.totalScannedFiles}/${this.totalItemsToScan} files scanned`
          );
        } else {
          this.clearInterval(heartbeatInterval);
        }
      },
      3000,
      'heartbeat'
    );

    const reportProgressInterval = this.createInterval(
      () => {
        if (this.progressEvents.length > 0) {
          const latestEvent =
            this.progressEvents[this.progressEvents.length - 1];
          eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', { ...latestEvent });
          this.progressEvents = [];
        }
      },
      500,
      'reportProgress'
    );

    return {
      progressCheck: progressCheckInterval,
      heartbeat: heartbeatInterval,
      reportProgress: reportProgressInterval,
    };
  }

  public async scanItems(pathNames?: string[]): Promise<void> {
    Logger.info(
      `[SYSTEM_SCAN] Starting new scan with ${
        pathNames ? pathNames.length : 'all'
      } paths`
    );

    try {
      await this.stopScan();
    } catch (stopError) {
      Logger.error('[SYSTEM_SCAN] Error stopping previous scan:', stopError);
    }

    this.cancelled = false;
    const scanStartTime = Date.now();
    const MAX_TOLERATED_ERRORS = 10;

    const scanState = {
      lastProgressCount: 0,
      lastScannedCount: 0,
      noProgressIntervals: 0,
      stuckScanCheckCount: 0,
      hasReportedError: false,
      scanCompleted: false,
      allFilesScanned: false,
      activeScans: { count: 0 },
    };

    try {
      if (!AppDataSource.isInitialized) {
        try {
          await AppDataSource.initialize();
        } catch (dbError) {
          Logger.error('[SYSTEM_SCAN] Error initializing database:', dbError);
        }
      }

      let antivirus: Antivirus | null = null;
      try {
        antivirus = await Antivirus.createInstance();
        this.antivirus = antivirus;
      } catch (avError) {
        Logger.error(
          '[SYSTEM_SCAN] Error creating antivirus instance, retrying once:',
          avError
        );

        await new Promise((resolve) => setTimeout(resolve, 3000));

        try {
          antivirus = await Antivirus.createInstance();
          this.antivirus = antivirus;
        } catch (retryError) {
          Logger.error(
            '[SYSTEM_SCAN] Failed to create antivirus instance after retry:',
            retryError
          );
          throw new Error('Failed to initialize antivirus scanner');
        }
      }

      const currentSession = ++this.scanSessionId;
      Logger.info(`[SYSTEM_SCAN] Starting scan session ${currentSession}`);

      const hasReportedErrorRef = { value: scanState.hasReportedError };
      const scan = this.createScanHandler(
        antivirus,
        currentSession,
        scanState.activeScans,
        MAX_TOLERATED_ERRORS,
        hasReportedErrorRef
      );

      scanState.hasReportedError = hasReportedErrorRef.value;

      const isCustomScan = !!pathNames;
      this.setupMonitoringIntervals(currentSession, scanState, isCustomScan);

      if (pathNames) {
        await this.performCustomScan(currentSession, pathNames, scan);
      } else {
        await this.performFullSystemScan(currentSession, scan);
      }

      await this.manualQueue?.drain();
      await this.waitForActiveScans(scanState.activeScans.count);

      if (!scanState.hasReportedError) {
        scanState.allFilesScanned =
          this.totalScannedFiles >= this.totalItemsToScan;

        this.emitProgressEvent(
          {
            currentScanPath: scanState.allFilesScanned
              ? 'Scan complete'
              : 'Scan in progress...',
            progress: scanState.allFilesScanned
              ? 100
              : this.calculateProgress(),
            done: scanState.allFilesScanned,
            scanId: `scan-${Date.now()}`,
          },
          currentSession
        );

        this.progressEvents = [];

        if (scanState.allFilesScanned) {
          Logger.info('[SYSTEM_SCAN] Sending final done event directly');
          this.emitCompletionEvent('Scan complete', 1500);
        }
      }

      scanState.scanCompleted = scanState.allFilesScanned;
    } catch (error) {
      Logger.error('[SYSTEM_SCAN] Error during manual scan:', error);

      if (!scanState.hasReportedError) {
        this.emitErrorEvent('Error occurred during scan');
        scanState.hasReportedError = true;
      }

      if (!isPermissionError(error)) {
        throw error;
      }
    } finally {
      if (!scanState.scanCompleted && !scanState.hasReportedError) {
        scanState.allFilesScanned =
          this.totalScannedFiles >= this.totalItemsToScan;

        this.emitProgressEvent(
          {
            currentScanPath: scanState.allFilesScanned
              ? 'Scan completed'
              : 'Scan interrupted',
            progress: scanState.allFilesScanned
              ? 100
              : this.calculateProgress(),
            done: scanState.allFilesScanned,
            scanId: `scan-final-${Date.now()}`,
          },
          this.scanSessionId
        );
      }

      scanState.scanCompleted = scanState.allFilesScanned;

      const scanDuration = (Date.now() - scanStartTime) / 1000;
      Logger.info(
        `[SYSTEM_SCAN] Scan finished in ${scanDuration.toFixed(
          2
        )}s with state:`,
        {
          completed: scanState.scanCompleted,
          filesScanned: this.totalScannedFiles,
          infected: this.totalInfectedFiles,
          errors: this.errorCount,
          cancelled: this.cancelled,
        }
      );

      this.clearAllIntervals();

      await this.clearAntivirus().catch((err) => {
        Logger.error(
          '[SYSTEM_SCAN] Error during final antivirus cleanup:',
          err
        );
      });
    }
  }

  private emitEmptyDirProgressEvent(
    currentScanPath: string,
    currentSession: number
  ) {
    this.emitProgressEvent(
      {
        currentScanPath,
        progress: 100,
        totalScannedFiles: 0,
        done: true,
        scanId: `scan-empty-${currentSession}`,
      },
      currentSession
    );
  }
}
