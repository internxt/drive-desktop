import { queue, QueueObject } from 'async';
import { AntivirusManager } from './antivirus-manager/antivirus-manager';
import { AntivirusEngine } from './antivirus-manager/types';
import { isPermissionError } from './utils/isPermissionError';
import { logger } from '@/apps/shared/logger/logger';
import { getFilesFromDirectory } from './utils/get-files-from-directory';
import { homedir } from 'node:os';
import { sendAntivirusProgress } from '../windows/widget';

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
  private manualQueue: QueueObject<string> | null;
  private progressEvents: ProgressData[];
  private totalScannedFiles: number;
  private totalInfectedFiles: number;
  private infectedFiles: string[];
  private totalItemsToScan: number;
  private cancelled = false;
  private scanSessionId = 0;

  private antivirus: AntivirusEngine | null;
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
      await this.antivirus.stop();
    }

    this.resetCounters();
  };

  private finishScan(currentSession: number) {
    this.cancelled = true;
    if (currentSession !== this.scanSessionId) return;

    if (this.progressEvents.length > 0) {
      sendAntivirusProgress({
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

  public async scanItems(pathNames?: string[]): Promise<void> {
    this.cancelled = false;
    this.scanSessionId++;
    const currentSession = this.scanSessionId;

    if (!this.antivirus) {
      const antivirusManager = await AntivirusManager.getInstance();
      this.antivirus = await antivirusManager.getActiveEngine();
    }
    const antivirus = this.antivirus;

    let reportProgressInterval: NodeJS.Timeout | null = null;

    reportProgressInterval = setInterval(() => {
      if (this.progressEvents.length > 0) {
        sendAntivirusProgress({
          ...(this.progressEvents.pop() as ProgressData),
        });
        this.progressEvents = [];
      }
    }, 1000);

    const scan = async (filePath: string) => {
      if (this.cancelled) return;
      try {
        const currentScannedFile = await antivirus?.scanFile({ filePath });

        if (currentScannedFile) {
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

    logger.debug({
      tag: 'ANTIVIRUS',
      msg: 'Starting manual scan',
      pathNames,
    });

    console.time('manual-scan');

    try {
      if (!pathNames || pathNames.length === 0) {
        pathNames = [homedir()];
      }

      const promises = pathNames.map((p) => getFilesFromDirectory({ rootFolder: p }));
      const result = await Promise.all(promises);
      const allFilePaths = result.flat();

      this.totalItemsToScan = allFilePaths.length;

      logger.debug({
        tag: 'ANTIVIRUS',
        msg: 'Retrieved all files',
        totalFiles: allFilePaths.length,
      });

      sendAntivirusProgress({
        totalScannedFiles: 0,
        infectedFiles: [],
        currentScanPath: '',
        progress: 0,
      });

      this.manualQueue = queue(scan, 10);

      if (this.totalItemsToScan > 0) {
        await this.manualQueue.pushAsync(allFilePaths);
        await this.manualQueue.drain();
      }

      logger.debug({ tag: 'ANTIVIRUS', msg: 'Manual scan completed' });

      this.finishScan(currentSession);
    } catch (error) {
      if (!isPermissionError(error)) {
        throw logger.error({
          tag: 'ANTIVIRUS',
          msg: 'Error during manual scan',
          exc: error,
        });
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
