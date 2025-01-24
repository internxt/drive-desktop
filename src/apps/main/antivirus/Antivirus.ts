import path from 'path';
import NodeClam, { NodeClamError } from '@internxt/scan';
import clamAVServer from './ClamAVServer';
import { app } from 'electron';

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

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await clamAVServer.startClamdServer();

      await clamAVServer.waitForClamd();

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
          timeout: 180000,
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
      viruses: string[],
      totalScannedFiles: [],
      progressRatio: number
    ) => void;
  }): Promise<void> {
    if (!this.clamAv) {
      throw new Error('ClamAV is not initialized');
    }

    return new Promise<void>(async (resolve, reject) => {
      await this.clamAv!.scanDir(
        folderPath,
        (err: NodeClamError, goodFiles: [], badFiles: [], viruses: []) => {
          if (err) {
            console.log('ERROR SCANNING DIR: ', err);
            reject(err);
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
      viruses: string[],
      totalScannedFiles: [],
      progressRatio: number
    ) => void;
  }): Promise<void> {
    if (!this.clamAv) {
      throw new Error('ClamAv instance is not initialized');
    }

    return new Promise<void>((resolve, reject) => {
      this.clamAv!.scanFiles(
        filePaths,
        (err: NodeClam, goodFiles: [], badFiles: [], viruses: []) => {
          if (err) {
            console.log('ERROR SCANNING FILES: ', err);
            reject(err);
          }

          onAllFilesScanned &&
            onAllFilesScanned(err, goodFiles, badFiles, viruses);
          resolve();
        },
        onFileScanned
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
      viruses: string[],
      totalScannedFiles: [],
      progressRatio: number
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
      console.log('ERROR WHILE SCANNING ITEMS: ', error);
      throw error;
    } finally {
      clamAVServer.stopClamdServer();
      this.isInitialized = false;
    }
  }
}
