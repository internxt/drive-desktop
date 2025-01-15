import path from 'path';
import NodeClam, { NodeClamError } from 'clamscan';
import clamAVServer from './ClamAVServer';
import { app } from 'electron';
import { exec, execFile } from 'child_process';

export interface SelectedItemToScanProps {
  path: string;
  itemName: string;
  isDirectory: boolean;
}

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'clamAV')
  : path.join(__dirname, '../../../../clamAV');

export class Antivirus {
  private static instance: Antivirus;
  private clamAv: NodeClam | null = null;
  private isInitialized = false;

  private constructor() {
    //
  }

  static async getInstance(): Promise<Antivirus> {
    if (!Antivirus.instance) {
      Antivirus.instance = new Antivirus();
      await Antivirus.instance.initialize();
    }

    if (!Antivirus.instance.isInitialized) {
      await Antivirus.instance.initialize();
    }

    return Antivirus.instance;
  }

  private async requestAdminPermissions(): Promise<void> {
    return new Promise((resolve, reject) => {
      const appPath = process.argv[0];
      const appArgs = process.argv.slice(1);

      execFile(
        'powershell',
        [
          '-Command',
          `Start-Process "${appPath}" "${appArgs.join(' ')}" -Verb runAs`,
        ],
        (error) => {
          if (error) {
            console.error('Error requesting admin permissions:', error);
            reject(error);
          } else {
            console.log('Application restarted with admin privileges.');
            app.quit();
            resolve();
          }
        }
      );
    });
  }

  private async isRunningAsAdmin(): Promise<boolean> {
    return new Promise((resolve) => {
      exec('net session', (error) => {
        resolve(!error);
      });
    });
  }

  private async startScanWithPermissions() {
    try {
      const isAdmin = await this.isRunningAsAdmin();
      if (!isAdmin) {
        console.log('Requesting admin permissions...');
        await this.requestAdminPermissions();
      }
    } catch (err) {
      console.error('Permission error:', err);
    }
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // await this.startScanWithPermissions();

      await clamAVServer.startClamdServer();

      await clamAVServer.waitForClamd();

      console.log('EXECUTING CLAMAV');

      this.clamAv = await new NodeClam().init({
        removeInfected: false,
        debugMode: true,
        scanRecursively: true,
        clamdscan: {
          path: path.join(RESOURCES_PATH, 'clamdscan.exe'),
          socket: false,
          host: '127.0.0.1',
          localFallback: false,
          port: 3310,
          timeout: 60000,
          multiscan: true,
          active: true,
        },
        preference: 'clamdscan',
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing ClamAV:', error);
      throw error;
    }
  }

  async scanFolder({
    folderPath,
    onFolderScanned,
    onFileScanned,
  }: {
    folderPath: string;
    onFolderScanned?: (
      err: NodeClamError | null,
      goodFiles: string[],
      badFiles: string[],
      viruses: string[]
    ) => void;
    onFileScanned?: (
      err: NodeClamError | null,
      file: string,
      isInfected: boolean,
      viruses?: string[]
    ) => void;
  }): Promise<void> {
    if (!this.clamAv) {
      throw new Error('ClamAV is not initialized');
    }

    return new Promise<void>((resolve, reject) => {
      this.clamAv!.scanDir(
        folderPath,
        (err, goodFiles, badFiles, viruses) => {
          if (err) {
            reject(err);
            return;
          }

          onFolderScanned && onFolderScanned(err, goodFiles, badFiles, viruses);

          resolve();
        },
        onFileScanned
      );
    });
  }

  async scanFiles({
    filePaths,
    onAllFilesScanned,
    onFileScanned,
  }: {
    filePaths: string[];
    onAllFilesScanned?: (
      err: NodeClamError | null,
      goodFiles: string[],
      badFiles: string[],
      viruses: string[]
    ) => void;
    onFileScanned?: (
      err: NodeClamError | null,
      file: string,
      isInfected: boolean,
      viruses: string[]
    ) => void;
  }): Promise<void> {
    if (!this.clamAv) {
      throw new Error('ClamAv instance is not initialized');
    }

    return new Promise<void>((resolve, reject) => {
      this.clamAv!.scanFiles(
        filePaths,
        (err, goodFiles, badFiles, viruses) => {
          if (err) {
            reject(err);
            return;
          }

          onAllFilesScanned &&
            onAllFilesScanned(err, goodFiles, badFiles, viruses);
          resolve();
        },
        (err, file, isInfected, viruses) => {
          console.log('SCANNING FILE: ', file, isInfected, viruses);
          onFileScanned && onFileScanned(err, file, isInfected, viruses);
        }
      );
    });
  }

  async scanItems({
    items,
    onAllItemsScanned,
    onFileScanned,
  }: {
    items: SelectedItemToScanProps[];
    onAllItemsScanned?: (
      err: NodeClamError | null,
      goodFiles: string[],
      badFiles: string[],
      viruses: string[]
    ) => void;
    onFileScanned?: (
      err: NodeClamError | null,
      file: string,
      isInfected: boolean,
      viruses?: string[]
    ) => void;
  }) {
    const filePaths = items
      .filter((item) => !item.isDirectory)
      .map((file) => file.path);
    const folderPaths = items
      .filter((item) => item.isDirectory)
      .map((folder) => folder.path);

    try {
      if (filePaths.length > 0) {
        await this.scanFiles({
          filePaths,
          onAllFilesScanned: onAllItemsScanned,
          onFileScanned,
        });
      }

      if (folderPaths.length > 0) {
        for (const folderPath of folderPaths) {
          await this.scanFolder({
            folderPath,
            onFolderScanned: onAllItemsScanned,
            onFileScanned,
          });
        }
      }
    } catch (error) {
      console.log('ERROR WHILE SCAN ITEMS: ', error);
    } finally {
      clamAVServer.stopClamdServer();
      this.isInitialized = false;
    }
  }
}
