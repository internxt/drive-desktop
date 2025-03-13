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
    const scannedItemsAdapter = new ScannedItemCollection();
    this.dbConnection = new DBScannerConnection(scannedItemsAdapter);
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

    let progressValue = 0;
    if (this.totalItemsToScan > 0) {
      const totalProcessedFiles = this.totalScannedFiles;
      if (totalProcessedFiles >= this.totalItemsToScan) {
        progressValue = 100;
      } else {
        progressValue = Math.min(
          Math.floor((totalProcessedFiles / this.totalItemsToScan) * 100),
          100
        );
      }
    } else {
      progressValue = 100;
    }

    if (this.totalScannedFiles % 50 === 0 || isInfected) {
      Logger.info(
        `[SYSTEM_SCAN] Progress: ${progressValue}%, Scanned: ${this.totalScannedFiles}/${this.totalItemsToScan}, Infected: ${this.totalInfectedFiles}`
      );
    }

    const progressEvent: ProgressData = {
      currentScanPath: file,
      infectedFiles: this.infectedFiles,
      progress: progressValue,
      totalScannedFiles: this.totalScannedFiles,
      scanId: `scan-${currentSession}`,
    };

    if (progressValue === 100) {
      progressEvent.done = true;
    }

    this.progressEvents.push(progressEvent);

    eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', { ...progressEvent });

    if (progressValue === 100) {
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

    await this.clearAntivirus();

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
    if (this.manualQueue) {
      try {
        this.manualQueue.kill();
        this.manualQueue = null;
      } catch (error) {
        Logger.error('[SYSTEM_SCAN] Error killing previous queue:', error);
      }
    }

    await this.clearAntivirus();
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
      const initialProgressEvent: ProgressData = {
        currentScanPath: 'Scanning your system...',
        infectedFiles: [],
        progress: 0,
        totalScannedFiles: 0,
        scanId: `scan-${currentSession}`,
      };

      eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', initialProgressEvent);

      const total = await countSystemFiles(userSystemPath.path);
      this.totalItemsToScan = total;

      Logger.info(`[SYSTEM_SCAN] Total system files to scan: ${total}`);

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
    let reportProgressInterval: NodeJS.Timeout | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;
    let progressCheckInterval: NodeJS.Timeout | null = null;
    let scanCompleted = false;
    let hasReportedError = false;
    let activeScans = 0;
    let stuckScanCheckCount = 0;
    let lastScannedCount = 0;
    const MAX_TOLERATED_ERRORS = 10;
    const MAX_STUCK_CHECKS = 5;
    const scanStartTime = Date.now();

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
          '[SYSTEM_SCAN] Error creating antivirus instance:',
          avError
        );
        throw new Error('Failed to initialize antivirus scanner');
      }

      const currentSession = ++this.scanSessionId;
      Logger.info(`[SYSTEM_SCAN] Starting scan session ${currentSession}`);

      let lastProgressCheckCount = this.totalScannedFiles;
      let noProgressIntervals = 0;
      const MAX_NO_PROGRESS_INTERVALS = 20;

      progressCheckInterval = setInterval(() => {
        if (!scanCompleted && !this.cancelled) {
          if (this.totalScannedFiles === lastProgressCheckCount) {
            noProgressIntervals++;
            Logger.debug(
              `[SYSTEM_SCAN] No progress for ${noProgressIntervals} intervals (${
                noProgressIntervals / 2
              } minutes)`
            );

            if (noProgressIntervals >= MAX_NO_PROGRESS_INTERVALS) {
              Logger.warn(
                `[SYSTEM_SCAN] No progress detected for ~${
                  noProgressIntervals / 2
                } minutes: ` +
                  `${this.totalScannedFiles}/${this.totalItemsToScan} files scanned. ` +
                  'Scan appears stalled but will continue.'
              );

              if (pathNames && !hasReportedError) {
                Logger.warn(
                  '[SYSTEM_SCAN] Custom scan appears stuck, triggering safety timeout'
                );
                this.cancelled = true;

                const timeoutEvent: ProgressData = {
                  currentScanPath:
                    'Scan appears stuck - no progress detected for 10 minutes',
                  infectedFiles: this.infectedFiles,
                  progress: 100,
                  totalScannedFiles: this.totalScannedFiles,
                  done: true,
                  scanId: `scan-stalled-${Date.now()}`,
                };
                eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', timeoutEvent);
                hasReportedError = true;
              }

              noProgressIntervals = MAX_NO_PROGRESS_INTERVALS - 5;
            }
          } else {
            noProgressIntervals = 0;
            lastProgressCheckCount = this.totalScannedFiles;
          }
        } else {
          if (progressCheckInterval) {
            clearInterval(progressCheckInterval);
            progressCheckInterval = null;
          }
        }
      }, 30000);

      heartbeatInterval = setInterval(() => {
        if (!this.cancelled && !scanCompleted) {
          if (this.totalScannedFiles >= this.totalItemsToScan) {
            Logger.info(
              `[SYSTEM_SCAN] All files scanned (${this.totalScannedFiles}/${this.totalItemsToScan}). Stopping heartbeat.`
            );

            if (!scanCompleted && !hasReportedError) {
              const finalProgressEvent: ProgressData = {
                currentScanPath: `Scan completed with ${this.errorCount} errors`,
                infectedFiles: this.infectedFiles,
                progress: 100,
                totalScannedFiles: this.totalScannedFiles,
                done: true,
                scanId: `scan-complete-${Date.now()}`,
              };

              eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', finalProgressEvent);
              scanCompleted = true;

              if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
                heartbeatInterval = null;
              }

              if (reportProgressInterval) {
                clearInterval(reportProgressInterval);
                reportProgressInterval = null;
              }
            }
            return;
          }

          if (this.totalScannedFiles === lastScannedCount) {
            stuckScanCheckCount++;

            if (stuckScanCheckCount >= MAX_STUCK_CHECKS) {
              const totalProcessed = this.totalScannedFiles + this.errorCount;
              const percentComplete =
                (totalProcessed / this.totalItemsToScan) * 100;

              if (
                percentComplete >= 99.5 ||
                this.totalItemsToScan - totalProcessed <= 5
              ) {
                Logger.warn(
                  `[SYSTEM_SCAN] Scan appears stuck at ${this.totalScannedFiles}/${this.totalItemsToScan} files. ` +
                    `With ${
                      this.errorCount
                    } errors, total processed: ${totalProcessed}/${
                      this.totalItemsToScan
                    } (${percentComplete.toFixed(2)}%). ` +
                    'Forcing completion.'
                );

                if (!scanCompleted && !hasReportedError) {
                  const finalProgressEvent: ProgressData = {
                    currentScanPath: `Scan completed with ${this.errorCount} errors`,
                    infectedFiles: this.infectedFiles,
                    progress: 100,
                    totalScannedFiles: this.totalScannedFiles,
                    done: true,
                    scanId: `scan-complete-${Date.now()}`,
                  };

                  eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', finalProgressEvent);
                  scanCompleted = true;

                  if (heartbeatInterval) {
                    clearInterval(heartbeatInterval);
                    heartbeatInterval = null;
                  }

                  if (reportProgressInterval) {
                    clearInterval(reportProgressInterval);
                    reportProgressInterval = null;
                  }

                  return;
                }
              }
            }
          } else {
            stuckScanCheckCount = 0;
            lastScannedCount = this.totalScannedFiles;
          }

          const heartbeatEvent: ProgressData = {
            currentScanPath: `Scanning in progress... (${this.totalScannedFiles}/${this.totalItemsToScan})`,
            infectedFiles: this.infectedFiles,
            progress:
              this.totalItemsToScan > 0
                ? this.totalScannedFiles >= this.totalItemsToScan
                  ? 100
                  : Math.floor(
                      (this.totalScannedFiles / this.totalItemsToScan) * 100
                    )
                : 50,
            totalScannedFiles: this.totalScannedFiles,
            scanId: `scan-${currentSession}-heartbeat`,
          };
          eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', heartbeatEvent);
          Logger.debug(
            `[SYSTEM_SCAN] Heartbeat: ${this.totalScannedFiles}/${this.totalItemsToScan} files scanned`
          );
        }
      }, 3000);

      reportProgressInterval = setInterval(() => {
        if (this.progressEvents.length > 0) {
          const latestEvent =
            this.progressEvents[this.progressEvents.length - 1];
          eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', { ...latestEvent });
          this.progressEvents = [];
        }
      }, 500);

      const scan = async (filePath: string) => {
        if (this.cancelled) return;

        activeScans++;
        const cleanPath = filePath;
        try {
          const scannedItem = await transformItem(cleanPath);
          const previousScannedItem =
            await this.dbConnection.getItemFromDatabase(scannedItem.pathName);
          if (previousScannedItem) {
            activeScans--;
            return this.handlePreviousScannedItem(
              currentSession,
              scannedItem,
              previousScannedItem
            );
          }

          try {
            const currentScannedFile = await antivirus.scanFile(
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

            if (this.errorCount > MAX_TOLERATED_ERRORS && !hasReportedError) {
              hasReportedError = true;
              const errorEvent: ProgressData = {
                currentScanPath: `Error: Too many scan failures (${this.errorCount} files failed)`,
                infectedFiles: this.infectedFiles,
                progress:
                  this.totalItemsToScan > 0
                    ? Math.round(
                        (this.totalScannedFiles / this.totalItemsToScan) * 100
                      )
                    : 100,
                totalScannedFiles: this.totalScannedFiles,
                done: true,
                scanId: `scan-error-${currentSession}`,
              };
              eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', errorEvent);
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
          activeScans--;
        }
      };

      if (pathNames) {
        await this.performCustomScan(currentSession, pathNames, scan);
      } else {
        await this.performFullSystemScan(currentSession, scan);
      }

      await this.manualQueue?.drain();

      const waitForActiveScans = async () => {
        const maxWaitTime = 30000;
        const startTime = Date.now();

        while (activeScans > 0) {
          const totalProcessed = this.totalScannedFiles + this.errorCount;
          const percentComplete =
            (totalProcessed / this.totalItemsToScan) * 100;

          if (
            percentComplete >= 99.5 ||
            this.totalItemsToScan - totalProcessed <= 5
          ) {
            Logger.info(
              `[SYSTEM_SCAN] Processed ${percentComplete.toFixed(
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
      };

      await waitForActiveScans();

      if (!hasReportedError) {
        const finalProgressEvent: ProgressData = {
          currentScanPath: '',
          infectedFiles: this.infectedFiles,
          progress: 100,
          totalScannedFiles: this.totalScannedFiles,
          done: true,
          scanId: `scan-${Date.now()}`,
        };

        this.progressEvents = [];

        Logger.info('[SYSTEM_SCAN] Sending final done event directly');
        eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', finalProgressEvent);

        setTimeout(() => {
          Logger.info('[SYSTEM_SCAN] Sending final done event after timeout');
          eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', finalProgressEvent);
        }, 1500);
      }

      scanCompleted = true;
    } catch (error) {
      Logger.error('[SYSTEM_SCAN] Error during manual scan:', error);

      if (!hasReportedError) {
        const errorEvent: ProgressData = {
          currentScanPath: 'Error occurred during scan',
          infectedFiles: this.infectedFiles,
          progress: 100,
          totalScannedFiles: this.totalScannedFiles,
          done: true,
          scanId: `scan-error-${Date.now()}`,
        };

        eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', errorEvent);
        hasReportedError = true;
      }

      if (!isPermissionError(error)) {
        throw error;
      }
    } finally {
      if (progressCheckInterval) {
        clearInterval(progressCheckInterval);
        progressCheckInterval = null;
      }

      if (reportProgressInterval) {
        clearInterval(reportProgressInterval);
        reportProgressInterval = null;
      }

      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }

      if (!scanCompleted && !hasReportedError) {
        const finalProgressEvent: ProgressData = {
          currentScanPath: '',
          infectedFiles: this.infectedFiles,
          progress: 100,
          totalScannedFiles: this.totalScannedFiles,
          done: true,
          scanId: `scan-final-${Date.now()}`,
        };

        Logger.info('[SYSTEM_SCAN] Sending final event from finally block');
        eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', finalProgressEvent);
      }

      scanCompleted = true;

      const scanDuration = (Date.now() - scanStartTime) / 1000;
      Logger.info(
        `[SYSTEM_SCAN] Scan finished in ${scanDuration.toFixed(
          2
        )}s with state:`,
        {
          completed: scanCompleted,
          filesScanned: this.totalScannedFiles,
          infected: this.totalInfectedFiles,
          errors: this.errorCount,
          cancelled: this.cancelled,
        }
      );

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
    const emptyDirProgressEvent: ProgressData = {
      currentScanPath: currentScanPath,
      infectedFiles: [],
      progress: 100,
      totalScannedFiles: 0,
      done: true,
      scanId: `scan-empty-${currentSession}`,
    };

    eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', emptyDirProgressEvent);
  }
}
