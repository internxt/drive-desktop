/* eslint-disable max-len */
import { ScannedItem } from '../database/entities/FileSystemHashed';
import { getUserSystemPath } from '../device/service';
import { queue, QueueObject } from 'async';
import eventBus from '../event-bus';
import { Antivirus } from './Antivirus';
import { countFilesInDirectory, getFilesFromDirectory } from './getFilesFromDirectory';
import { transformItem } from './utils/transformItem';

import { isPermissionError } from './utils/isPermissionError';
import { DBScannerConnection } from './utils/dbConections';
import { HashedSystemTreeCollection } from '../database/collections/HashedSystemTreeCollection';

export interface ScannedFileData {
  file: string;
  isInfected: boolean;
  viruses: [];
}

export interface FolderContent {
  files: ScannedItem[];
  folders: string[];
}

export interface ProgressData {
  totalScannedFiles: number;
  infectedFiles: string[];
  currentScanPath: string;
  progress: number;
  done?: boolean;
}

let fileSystemMonitorInstanceManual: FileSystemMonitor | null = null;

export async function getManualScanMonitorInstance() {
  if (!fileSystemMonitorInstanceManual) {
    fileSystemMonitorInstanceManual = new FileSystemMonitor();
  }
  return fileSystemMonitorInstanceManual;
}

export class FileSystemMonitor {
  private dbConnection: DBScannerConnection;
  private manualQueue: QueueObject<string> | null;
  private progressEvents: ProgressData[];
  private totalScannedFiles: number;
  private totalInfectedFiles: number;
  private infectedFiles: string[];
  private totalItemsToScan: number;

  constructor() {
    this.progressEvents = [];
    this.manualQueue = null;
    this.progressEvents = [];
    this.totalScannedFiles = 0;
    this.totalInfectedFiles = 0;
    this.infectedFiles = [];
    this.totalItemsToScan = 0;

    const hashedFilesAdapter = new HashedSystemTreeCollection();
    this.dbConnection = new DBScannerConnection(hashedFilesAdapter);
  }

  trackProgress = (data: { file: string; isInfected: boolean }) => {
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
    if (this.manualQueue) {
      this.manualQueue.kill();
    }

    const antivirus = await Antivirus.getInstance();
    await antivirus.stopClamAv();

    this.resetCounters();
  };

  private finishScan() {
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
  }

  private handlePreviousScannedItem = async (scannedItem: ScannedItem, previousScannedItem: ScannedItem) => {
    if (scannedItem.updatedAtW === previousScannedItem.updatedAtW || scannedItem.hash === previousScannedItem.hash) {
      this.trackProgress({
        file: previousScannedItem.pathName,
        isInfected: previousScannedItem.isInfected,
      });
      return;
    }
  };

  public async scanItems(pathNames?: string[]): Promise<void> {
    const antivirus = await Antivirus.getInstance();
    await antivirus.initialize();

    let pathsToScan: string[] = [];
    if (pathNames && pathNames.length > 0) {
      pathsToScan = pathNames;
    } else {
      const userSystemPath = await getUserSystemPath();
      if (!userSystemPath) return;
      pathsToScan = [userSystemPath.path];
    }

    for (const p of pathsToScan) {
      this.totalItemsToScan += await countFilesInDirectory(p);
    }

    let reportProgressInterval: NodeJS.Timeout | null = null;

    reportProgressInterval = setInterval(() => {
      if (this.progressEvents.length > 0) {
        eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', {
          ...(this.progressEvents.pop() as ProgressData),
        });
        this.progressEvents = [];
      }
    }, 1000);

    console.time('scan-timer');

    const scan = async (filePath: string) => {
      console.log('SCAN ITEM: ', filePath);
      try {
        const scannedItem = await transformItem(filePath);
        const previousScannedItem = await this.dbConnection.getItemFromDatabase(scannedItem.pathName);
        if (previousScannedItem) {
          this.handlePreviousScannedItem(scannedItem, previousScannedItem);

          return;
        }

        const currentScannedFile = await antivirus.scanFile(scannedItem.pathName);

        if (currentScannedFile) {
          await this.dbConnection.addItemToDatabase({
            ...scannedItem,
            isInfected: currentScannedFile.isInfected,
          });

          this.trackProgress({
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

    try {
      this.manualQueue = queue(scan, 10);
      for (const p of pathsToScan) {
        await getFilesFromDirectory(p, (filePath: string) => this.manualQueue!.pushAsync(filePath));
      }

      await this.manualQueue.drain();

      this.finishScan();
    } catch (error) {
      if (!isPermissionError(error)) {
        throw error;
      }
    } finally {
      console.timeEnd('scan-timer');
      if (reportProgressInterval) {
        clearInterval(reportProgressInterval);
      }
    }
  }
}
