import { createReadStream, Dirent } from 'fs';
import { readdir, stat } from 'fs/promises';
import { DatabaseCollectionAdapter } from '../database/adapters/base';
import { FileSystemHashed } from '../database/entities/FileSystemHashed';
import { createHash, randomUUID } from 'crypto';
import { getUserSystemPath } from '../device/service';
import { extname, resolve } from 'path';
import NodeClamError from '@internxt/scan/lib/NodeClamError';
import { BrowserWindow } from 'electron';
import { pipeline } from 'stream/promises';
import { queue } from 'async';
import { Antivirus } from './Antivirus';
import { HashedSystemTreeCollection } from '../database/collections/HashedSystemTreeCollection';
import eventBus from '../event-bus';

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
  done?: boolean;
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

let fileSystemMonitorInstance: FileSystemMonitor | null = null;

/**
 * Retorna siempre la misma instancia de FileSystemMonitor.
 * Si no existe, la crea y la devuelve.
 */
export async function getFileSystemMonitorInstance() {
  if (!fileSystemMonitorInstance) {
    // Aquí creas la instancia con todo lo que necesites
    const hashedFilesAdapter = new HashedSystemTreeCollection();
    const antivirus = await Antivirus.getInstance();

    fileSystemMonitorInstance = new FileSystemMonitor(
      {
        hashedFiles: hashedFilesAdapter,
      },
      { scanner: antivirus }
    );
  }

  return fileSystemMonitorInstance;
}

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
  private progressEvents: ProgressData[] = [];
  private totalScannedFiles = 0;
  private totalInfectedFiles = 0;
  private infectedFiles: string[] = [];
  private progress = 0;

  constructor(
    private db: {
      hashedFiles: DatabaseCollectionAdapter<FileSystemHashed>;
    },
    private antivirus: {
      scanner: Antivirus;
    }
  ) {
    this.db;
  }

  private addItemToDatabase = async (
    item: FileInfo & { isInfected: FileSystemHashed['isInfected'] }
  ): Promise<boolean> => {
    const { path: pathName, size, type, isInfected } = item;
    const hashedFile = await this.hashItem(pathName);
    const currentTime = new Date().toISOString();

    const itemToAdd: FileSystemHashed = {
      createdAt: currentTime,
      updatedAt: currentTime,
      pathName,
      size,
      status: 'scanned',
      id: randomUUID(),
      type,
      hash: hashedFile,
      isInfected,
    };

    try {
      const createdItem = await this.db.hashedFiles.create(itemToAdd);

      return createdItem.success;
    } catch (error) {
      return EMPTY_RESULT.success;
    }
  };

  private updateItemToDatabase = async (
    itemId: FileSystemHashed['id'],
    item: FileInfo & { isInfected: FileSystemHashed['isInfected'] }
  ): Promise<{
    success: boolean;
    result: FileSystemHashed | null;
  }> => {
    const { path: pathName, size, type, isInfected } = item;
    const hashedFile = await this.hashItem(pathName);
    const currentTime = new Date().toISOString();

    const itemToUpdate: Partial<FileSystemHashed> = {
      updatedAt: currentTime,
      pathName,
      size,
      type,
      hash: hashedFile,
      isInfected,
    };

    try {
      const createdItem = await this.db.hashedFiles.update(
        itemId,
        itemToUpdate
      );

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
      if (this.isPermissionError(error)) {
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

    try {
      const scannedFile = await this.antivirus.scanner.scanFile(filePath);

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

  trackProgress = (data: { file: string; isInfected: boolean }) => {
    const { file, isInfected } = data;
    if (isInfected) {
      this.infectedFiles.push(file);
      this.totalInfectedFiles++;
    }

    this.totalScannedFiles++;

    const progressEvent: ProgressData = {
      currentScanPath: file,
      infectedFiles: this.infectedFiles,
      progress: 0,
      totalInfectedFiles: this.totalInfectedFiles,
      totalScannedFiles: this.totalScannedFiles,
    };

    this.progressEvents.push(progressEvent);
  };

  isSystemScanning = () => {
    this.mainWindow.webContents.send(
      'is-system-scan-in-progress',
      this.isScanning
    );
  };

  public scanUserDir = async (): Promise<void> => {
    this.totalScannedFiles = 0;
    this.totalInfectedFiles = 0;
    this.infectedFiles = [];
    this.progressEvents = [];

    if (this.isScanning) {
      if (this.progressEvents.length > 0) {
        eventBus.emit(
          'ANTIVIRUS_SCAN_PROGRESS',
          this.progressEvents[this.progressEvents.length - 1]
        );
      }
      return;
    }

    this.isScanning = true;

    const reportProgressInterval = setInterval(() => {
      eventBus.emit(
        'ANTIVIRUS_SCAN_PROGRESS',
        this.progressEvents.pop() as ProgressData
      );

      this.progressEvents = [];
    }, 1000);

    console.time('scan-system');

    const MAX_CONCURRENCY = 10;

    const scan = async (file: FileInfo) => {
      const previousScannedItem = await this.getItemFromDatabase(file.path);
      if (previousScannedItem) {
        this.trackProgress({
          file: previousScannedItem.pathName,
          isInfected: previousScannedItem.isInfected,
        });

        if (file.hash === previousScannedItem.hash) {
          return;
        } else {
          const currentScannedFile = await this.scanFile(file.path);
          if (!currentScannedFile) {
            return;
          }
          console.log('SCANNED ITEM: ', currentScannedFile);
          await this.updateItemToDatabase(previousScannedItem.id, {
            ...file,
            isInfected: currentScannedFile.isInfected,
          });
        }
      }
      const currentScannedFile = await this.scanFile(file.path);
      if (!currentScannedFile) {
        return;
      }
      console.log('SCANNED ITEM: ', currentScannedFile);
      await this.addItemToDatabase({
        ...file,
        isInfected: currentScannedFile.isInfected,
      });
      this.trackProgress({
        file: currentScannedFile.file,
        isInfected: currentScannedFile.isInfected,
      });
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
      console.timeEnd('scan-system');
      this.antivirus.scanner.stopClamAv();
      eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', {
        ...(this.progressEvents.pop() as ProgressData),
        done: true,
      });
      clearInterval(reportProgressInterval);
      this.progressEvents = [];
      this.isScanning = false;
    }
  };
}
