/* eslint-disable max-len */
import { ScannedItem } from '../database/entities/ScannedItem';
import { getUserSystemPath } from '../device/service';
import { queue, QueueObject } from 'async';
import eventBus from '../event-bus';
import { Antivirus } from './Antivirus';
import { countSystemFiles, getFilesFromDirectory } from './utils/getFilesFromDirectory';
import { transformItem } from './utils/transformItem';
import { isPermissionError } from './utils/isPermissionError';
import { DBScannerConnection } from './utils/dbConections';
import { ScannedItemCollection } from '../database/collections/ScannedItemCollection';

export interface ProgressData {
  totalScannedFiles: number;
  infectedFiles: string[];
  currentScanPath: string;
  progress: number;
  done?: boolean;
}

let fileSystemMonitorInstanceManual: ManualSystemScan | null = null;

export async function getManualScanMonitorInstance() {
  if (!fileSystemMonitorInstanceManual) {
    fileSystemMonitorInstanceManual = new ManualSystemScan();
  }
  return fileSystemMonitorInstanceManual;
}

class ManualSystemScan {
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

  trackProgress = (currentSession: number, data: { file: string; isInfected: boolean }) => {
    if (currentSession !== this.scanSessionId) return;
    const { file, isInfected } = data;
    if (isInfected) {
      this.infectedFiles.push(file);
      this.totalInfectedFiles++;
    }
    this.totalScannedFiles++;

    const progressValue = this.totalItemsToScan > 0 ? Math.round((this.totalScannedFiles / this.totalItemsToScan) * 100) : 0;

    const progressEvent: ProgressData = {
      currentScanPath: file,
      infectedFiles: this.infectedFiles,
      progress: progressValue,
      totalScannedFiles: this.totalScannedFiles,
    };
    this.progressEvents.push(progressEvent);
  };

  public stopScan = async () => {
    this.cancelled = true;
    this.scanSessionId++;
    if (this.manualQueue) {
      console.log('KILLING PROCESSES');
      this.manualQueue.kill();
    }

    if (this.antivirus) {
      await this.antivirus.stopClamAv();
    }

    this.resetCounters();
  };

  private finishScan(currentSession: number) {
    this.cancelled = true;
    if (currentSession !== this.scanSessionId) return;

    if (this.progressEvents.length > 0) {
      eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', {
        ...(this.progressEvents.pop() as ProgressData),
        done: true,
      });
    }
    this.resetCounters();
  }

  private resetCounters() {
    this.totalInfectedFiles = 0;
    this.totalScannedFiles = 0;
    this.infectedFiles = [];
    this.progressEvents = [];
    this.totalItemsToScan = 0;
    this.manualQueue = null;
    this.antivirus = null;
  }

  private handlePreviousScannedItem = async (currentSession: number, scannedItem: ScannedItem, previousScannedItem: ScannedItem) => {
    if (currentSession !== this.scanSessionId) return;

    if (scannedItem.updatedAtW === previousScannedItem.updatedAtW || scannedItem.hash === previousScannedItem.hash) {
      this.trackProgress(currentSession, {
        file: previousScannedItem.pathName,
        isInfected: previousScannedItem.isInfected,
      });
    }
  };

  public async scanItems(pathNames?: string[]): Promise<void> {
    this.cancelled = false;
    this.scanSessionId++;
    const currentSession = this.scanSessionId;

    if (!this.antivirus) {
      this.antivirus = await Antivirus.createInstance();
    }
    const antivirus = this.antivirus;

    let reportProgressInterval: NodeJS.Timeout | null = null;

    reportProgressInterval = setInterval(() => {
      if (this.progressEvents.length > 0) {
        eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', {
          ...(this.progressEvents.pop() as ProgressData),
        });
        this.progressEvents = [];
      }
    }, 1000);

    const scan = async (filePath: string) => {
      if (this.cancelled) return;
      try {
        const scannedItem = await transformItem(filePath);
        const previousScannedItem = await this.dbConnection.getItemFromDatabase(scannedItem.pathName);
        if (previousScannedItem) {
          return this.handlePreviousScannedItem(currentSession, scannedItem, previousScannedItem);
        }

        const currentScannedFile = await antivirus.scanFile(scannedItem.pathName);

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

    console.time('manual-scan');
    try {
      if (!pathNames) {
        const userSystemPath = await getUserSystemPath();
        if (!userSystemPath) return;

        const countPromise = countSystemFiles(userSystemPath.path);

        await new Promise((resolve) => setTimeout(resolve, 15000));

        this.manualQueue = queue(scan, 10);
        const filesPromise = getFilesFromDirectory(userSystemPath.path, (filePath: string) => this.manualQueue!.pushAsync(filePath));

        this.totalItemsToScan = await countPromise;

        await filesPromise;
      } else {
        let pathsToScan: string[] = [];
        if (pathNames && pathNames.length > 0) {
          pathsToScan = pathNames;
        } else {
          const userSystemPath = await getUserSystemPath();
          if (!userSystemPath) return;
          pathsToScan = [userSystemPath.path];
        }

        let total = 0;
        for (const p of pathNames) {
          total += await countSystemFiles(p);
        }

        this.totalItemsToScan = total;

        eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', {
          totalScannedFiles: 0,
          infectedFiles: [],
          currentScanPath: '',
          progress: 0,
        });

        this.manualQueue = queue(scan, 10);
        for (const p of pathsToScan) {
          await getFilesFromDirectory(p, (filePath: string) => this.manualQueue!.pushAsync(filePath));
        }
      }

      await this.manualQueue.drain();
      this.finishScan(currentSession);
    } catch (error) {
      if (!isPermissionError(error)) {
        throw error;
      }
      this.resetCounters();
      await this.manualQueue?.drain();
    } finally {
      console.timeEnd('manual-scan');
      if (reportProgressInterval) {
        clearInterval(reportProgressInterval);
      }
    }
  }
}
