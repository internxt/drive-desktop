import { createReadStream, Dirent } from 'fs';
import { readdir, stat } from 'fs/promises';
import { DatabaseCollectionAdapter } from '../database/adapters/base';
import { FileSystemHashed } from '../database/entities/FileSystemHashed';
import { createHash, randomUUID } from 'crypto';
import { getUserSystemPath } from '../device/service';
import clamAVServer from './ClamAVServer';
import { extname, resolve } from 'path';
import NodeClamError from '@internxt/scan/lib/NodeClamError';
import { BrowserWindow } from 'electron';
import { pipeline } from 'stream/promises';
import { queue } from 'async';
import { Antivirus } from './Antivirus';

interface PermissionError extends Error {
  code?: string;
}

export interface FileInfo {
  path: FileSystemHashed['pathName'];
  type: FileSystemHashed['type'];
  size: FileSystemHashed['size'];
  hash: FileSystemHashed['hash'];
}

export interface ScannedFileData {
  file: string;
  isInfected: boolean;
  viruses: [];
}

export interface FolderContent {
  files: FileInfo[];
  folders: string[];
}

export interface ProgressData {
  totalScannedFiles: number;
  totalInfectedFiles: number;
  infectedFiles: string[];
  currentScanPath: string;
  progress: number;
}

const PERMISSION_ERROR_CODES = [
  'EACCES',
  'EPERM',
  'EBUSY',
  'ENOENT',
  'ENOFILE',
  'EISDIR',
];

const PERMISSION_ERROR_MESSAGES = [
  'operation not permitted',
  'access denied',
  'access is denied',
];

const EMPTY_RESULT = {
  success: false,
  result: null,
};

export class FileSystemMonitor {
  private mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
    },
    show: false,
  });
  private isScanning = false;
  private progressEvents = [];

  constructor(
    private db: {
      hashedFiles: DatabaseCollectionAdapter<FileSystemHashed>;
    }
  ) {}

  private addItemToDatabase = async (
    item: FileInfo
  ): Promise<{
    success: boolean;
    result: FileSystemHashed | null;
  }> => {
    const { path: pathName, size, type } = item;
    const hashedFile = await this.hashItem(pathName);
    const currentTime = new Date().toISOString();

    const itemToAdd: FileSystemHashed = {
      createdAt: currentTime,
      updatedAt: currentTime,
      pathName: pathName,
      size: size,
      status: 'scanned',
      id: randomUUID(),
      type: type,
      hash: hashedFile,
    };

    try {
      const createdItem = await this.db.hashedFiles.create(itemToAdd);

      return createdItem;
    } catch (error) {
      return EMPTY_RESULT;
    }
  };

  private getItemFromDatabase = async (
    pathName: FileSystemHashed['pathName']
  ) => {
    const { result, success } = await this.db.hashedFiles.getByPathName(
      pathName
    );

    if (success) {
      return result;
    } else {
      throw result;
    }
  };

  private hashItem = async (filePath: string): Promise<string> => {
    try {
      const hasher = createHash('sha256');
      const stream = createReadStream(filePath);

      stream.pipe(hasher);
      await pipeline(stream, hasher);

      return hasher.digest('hex');
    } catch (error) {
      console.log('ERROR');
      throw error;
    }
  };

  private isPermissionError = (err: unknown) => {
    if (!err || typeof err !== 'object') return false;

    const error = err as any;
    const msg = error.message?.toLowerCase() || '';

    console.log('error', err);

    const hasPermissionErrorCode = PERMISSION_ERROR_CODES.includes(
      error.code as (typeof PERMISSION_ERROR_CODES)[number]
    );
    const hasPermissionErrorMessage = PERMISSION_ERROR_MESSAGES.some(
      (msgPart) => msg.includes(msgPart)
    );

    console.log({
      hasPermissionErrorCode,
      hasPermissionErrorMessage,
    });

    return hasPermissionErrorCode || hasPermissionErrorMessage;
  };

  private getFilesFromDirectory = async (
    dir: string,
    cb: (file: FileInfo) => Promise<void>
  ): Promise<void | null> => {
    let items: Dirent[];

    try {
      items = await readdir(dir, { withFileTypes: true });
    } catch (err) {
      let error = err;
      if (
        err instanceof NodeClamError &&
        (err as any).data?.err instanceof Error
      ) {
        error = (err as any).data.err;
      }
      if (this.isPermissionError(err)) {
        console.warn(`Skipping directory "${dir}" due to permission error.`);
        return null;
      }
      throw err;
    }

    const nonTempItems = items.filter((item) => {
      const fullPath = resolve(dir, item.name);
      const isTempFileOrFolder =
        fullPath.toLowerCase().includes('temp') ||
        fullPath.toLowerCase().includes('tmp');

      return !isTempFileOrFolder;
    });

    for (const item of nonTempItems) {
      const fullPath = resolve(dir, item.name);

      if (item.isDirectory()) {
        try {
          const subitems = await readdir(fullPath, { withFileTypes: true });
          if (subitems.length > 0) {
            await this.getFilesFromDirectory(fullPath, cb);
          }
        } catch (err) {
          if (!this.isPermissionError(err)) {
            throw err;
          }
          console.warn(
            `Skipping subdirectory "${fullPath}" due to permission error.`
          );
        }
      } else {
        const fileType = extname(fullPath).toLowerCase();
        const { size } = await stat(fullPath);
        const hashedItem = await this.hashItem(fullPath);
        await cb({ path: fullPath, type: fileType, size, hash: hashedItem });
      }
    }
  };

  private scanFile = async (
    filePath: string
  ): Promise<{
    file: string;
    isInfected: boolean;
    viruses: [];
  } | null> => {
    console.time('scan-file');
    const antivirus = await Antivirus.getInstance();
    try {
      const scannedFile = await antivirus.scanFile(filePath);

      return scannedFile;
    } catch (fileErr) {
      console.log('ERROR WHILE SCANNING ITEM: ', fileErr);
      if (this.isPermissionError(fileErr)) {
        console.warn(`Skipping file "${filePath}" due to permission error.`);
        return null;
      }
      const error = fileErr as Error;
      console.log(`ERROR SCANNING FILE "${filePath}":`, error);
      throw error;
    } finally {
      console.timeEnd('scan-file');
    }
  };

  trackProgress = (data: ProgressData) => {
    this.progressEvents.push(data);
  };

  isSystemScanning = () => {
    this.mainWindow.webContents.send(
      'is-system-scan-in-progress',
      this.isScanning
    );
  };

  // private getModifiedFiles = async (
  //   allFiles: FileInfo[],
  //   savedScannedItems: FileSystemHashed[]
  // ): Promise<FileInfo[]> => {
  //   const modifiedFiles: FileInfo[] = [];

  //   const scannedItemsMap = new Map<string, FileSystemHashed>(
  //     savedScannedItems.map((item) => [item.pathName, item])
  //   );

  //   for (const file of allFiles) {
  //     const savedItem = scannedItemsMap.get(file.path);
  //     if (savedItem) {
  //       try {
  //         const currentHash = await this.hashItem(file.path);
  //         if (currentHash !== savedItem.hash) {
  //           modifiedFiles.push(file);
  //         }
  //       } catch (err) {
  //         console.warn(`ERROR HASHING THE FILE "${file.path}". SKIPPING IT.`);
  //         continue;
  //       }
  //     } else {
  //       modifiedFiles.push(file);
  //     }
  //   }

  //   return modifiedFiles;
  // };

  // private simulateFakeProgress = async (
  //   allFiles: FileInfo[]
  // ): Promise<void> => {
  //   const fakeTotal = Math.min(20, allFiles.length);
  //   const fakeFiles = this.getRandomItems(allFiles, fakeTotal);

  //   for (let i = 0; i <= fakeTotal; i++) {
  //     const progress = (i / fakeTotal) * 100;
  //     const currentScanPath = fakeFiles[i - 1]?.path || 'Simulating...';

  //     this.currentProgress = {
  //       totalScannedFiles: i,
  //       totalInfectedFiles: 0,
  //       infectedFiles: [],
  //       currentScanPath: currentScanPath,
  //       progress: progress,
  //     };

  //     this.trackProgress(this.currentProgress);

  //     await this.delay(6000);
  //   }
  // };

  // private getRandomItems = <T>(items: T[], count: number): T[] => {
  //   const shuffled = items.slice();
  //   for (let i = shuffled.length - 1; i > 0; i--) {
  //     const j = Math.floor(Math.random() * (i + 1));
  //     [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  //   }
  //   return shuffled.slice(0, count);
  // };

  // private delay = (ms: number): Promise<void> =>
  //   new Promise((resolve) => setTimeout(resolve, ms));

  public scanUserDir = async (): Promise<void> => {
    console.time('scan-system');

    const reportProgressInterval = setInterval(() => {
      this.mainWindow.webContents.send(
        'scan-progress',
        this.progressEvents.pop()
      );

      this.progressEvents = [];
    }, 1000);

    const MAX_CONCURRENCY = 10;

    const scan = async (file: FileInfo) => {
      const previousScannedItem = await this.getItemFromDatabase(file.path);
      if (previousScannedItem && file.hash === previousScannedItem.hash) {
        console.log('ITEM IN DATABASE:', previousScannedItem);
        return;
      }
      const currentScannedFile = await this.scanFile(file.path);
      if (!currentScannedFile) {
        return;
      }
      console.log('SCANNED ITEM: ', currentScannedFile);
      await this.addItemToDatabase(file);
      // this.trackProgress(currentScannedFile);
    };

    const asyncQueue = queue(scan, MAX_CONCURRENCY);

    try {
      const userSystemPath = await getUserSystemPath();
      if (!userSystemPath) return;

      await this.getFilesFromDirectory(
        `${userSystemPath.path}\\AppData\\Local\\Microsoft`,
        (file: FileInfo) => asyncQueue.pushAsync(file)
      );
    } catch (err) {
      const error = err as Error;
      console.log('ERROR IN SCAN USER DIR:', error);
      if (!this.isPermissionError(error)) {
        throw error;
      }
    } finally {
      clamAVServer.stopClamdServer();
      clearInterval(reportProgressInterval);
      console.timeEnd('scan-system');
    }
  };
}
