/* eslint-disable max-len */
import { ScannedItem } from '../database/entities/ScannedItem';
import { getUserSystemPath } from '../device/service';
import { queue, QueueObject } from 'async';
import eventBus from '../event-bus';
import { Antivirus } from './Antivirus';
import {
  countFilesUsingLinuxCommand,
  getFilesFromDirectory,
} from './utils/getFilesFromDirectory';
import { transformItem } from './utils/transformItem';
import { isPermissionError } from './utils/isPermissionError';
import { DBScannerConnection } from './utils/dbConections';
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
    this.scanSessionId = 0;

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
      progressValue = Math.min(
        Math.round((this.totalScannedFiles / this.totalItemsToScan) * 100),
        100
      );
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

  public stopScan = async () => {
    this.cancelled = true;
    this.scanSessionId++;
    if (this.manualQueue) {
      this.manualQueue.kill();
    }

    if (this.antivirus) {
      try {
        await this.antivirus.stopClamAv();
      } catch (error) {
        Logger.error('[SYSTEM_SCAN] Error stopping ClamAV:', error);
      }
    }

    this.resetCounters();
  };

  private resetCounters() {
    Logger.info('[SYSTEM_SCAN] Resetting scan counters and state');

    this.totalScannedFiles = 0;
    this.totalInfectedFiles = 0;
    this.infectedFiles = [];
    this.progressEvents = [];
    this.totalItemsToScan = 0;

    if (this.manualQueue) {
      try {
        this.manualQueue.kill();
        this.manualQueue = null;
      } catch (error) {
        Logger.error('[SYSTEM_SCAN] Error killing previous queue:', error);
      }
    }

    this.antivirus = null;
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

  public async scanItems(pathNames?: string[]): Promise<void> {
    this.cancelled = false;
    this.resetCounters();
    let reportProgressInterval: NodeJS.Timeout | null = null;
    let scanCompleted = false;

    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }

      const antivirus = await Antivirus.createInstance();
      this.antivirus = antivirus;

      const currentSession = ++this.scanSessionId;

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
        const cleanPath = filePath;
        try {
          const scannedItem = await transformItem(cleanPath);
          const previousScannedItem =
            await this.dbConnection.getItemFromDatabase(scannedItem.pathName);
          if (previousScannedItem) {
            return this.handlePreviousScannedItem(
              currentSession,
              scannedItem,
              previousScannedItem
            );
          }

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
          if (!isPermissionError(error)) {
            throw error;
          }
        }
      };

      if (pathNames) {
        // Custom scan mode
        Logger.info('[SYSTEM_SCAN] Starting custom scan with selected paths');
        const pathsToScan: string[] = pathNames;

        this.manualQueue = queue(scan, 10);

        let total = 0;
        for (const p of pathNames) {
          try {
            total += await countFilesUsingLinuxCommand(p);
          } catch (error) {
            Logger.error(
              `[SYSTEM_SCAN] Error counting files in path ${p}:`,
              error
            );
          }
        }

        this.totalItemsToScan = total;
        Logger.info(`[SYSTEM_SCAN] Total files to scan: ${total}`);

        for (const p of pathsToScan) {
          await getFilesFromDirectory(p, (filePath: string) =>
            this.manualQueue!.pushAsync(filePath)
          );
        }
      } else {
        // System scan mode
        Logger.info('[SYSTEM_SCAN] Starting full system scan');

        const userSystemPath = await getUserSystemPath();
        if (!userSystemPath) {
          Logger.error('[SYSTEM_SCAN] Could not get user system path');
          return;
        }

        Logger.info(
          `[SYSTEM_SCAN] Using user system path: ${userSystemPath.path}`
        );

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

          const total = await countFilesUsingLinuxCommand(userSystemPath.path);
          this.totalItemsToScan = total;

          Logger.info(`[SYSTEM_SCAN] Total system files to scan: ${total}`);

          await getFilesFromDirectory(userSystemPath.path, (filePath: string) =>
            this.manualQueue!.pushAsync(filePath)
          );
        } catch (error) {
          Logger.error('[SYSTEM_SCAN] Error in system scan process:', error);
          throw error;
        }
      }

      await this.manualQueue?.drain();

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

      scanCompleted = true;
    } catch (error) {
      Logger.error('[SYSTEM_SCAN] Error during manual scan:', error);
      if (!isPermissionError(error)) {
        throw error;
      }
    } finally {
      if (reportProgressInterval) {
        clearInterval(reportProgressInterval);
      }

      if (!scanCompleted && !this.cancelled) {
        const finalProgressEvent: ProgressData = {
          currentScanPath: '',
          infectedFiles: this.infectedFiles,
          progress: 100,
          totalScannedFiles: this.totalScannedFiles,
          done: true,
          scanId: `scan-error-${Date.now()}`,
        };

        eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', finalProgressEvent);
      }
    }
  }
}
