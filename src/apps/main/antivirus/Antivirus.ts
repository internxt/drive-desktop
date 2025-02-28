import path from 'path';
import NodeClam from '@internxt/scan';
import clamAVServer from './ClamAVDaemon';
import { app } from 'electron';
import Logger from 'electron-log';
export interface SelectedItemToScanProps {
  path: string;
  itemName: string;
  isDirectory: boolean;
}

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'clamAV')
  : path.join(__dirname, '../../../../clamAV');

export class Antivirus {
  private clamAv: NodeClam | null = null;
  private isInitialized = false;

  private constructor() {
    //
  }

  static async createInstance(): Promise<Antivirus> {
    const instance = new Antivirus();
    await instance.initialize();
    return instance;
  }

  async initialize(): Promise<void> {
    try {
      await clamAVServer.checkClamdAvailability();

      const clamdConfigPath = path.join(RESOURCES_PATH, '/etc/clamd.conf');

      this.clamAv = await new NodeClam().init({
        removeInfected: false,
        debugMode: true,
        scanRecursively: true,
        clamdscan: {
          path: path.join(RESOURCES_PATH, '/bin/clamdscan'),
          configFile: clamdConfigPath,
          socket: false,
          host: '127.0.0.1',
          localFallback: false,
          port: 3310,
          timeout: 3600000,
          multiscan: true,
          active: true,
        },
        preference: 'clamdscan',
      });

      this.isInitialized = true;
    } catch (error) {
      Logger.error('Error Initializing ClamAV:', error);
      throw error;
    }
  }

  async scanFile(
    filePath: string
  ): Promise<{ file: string; isInfected: boolean; viruses: [] }> {
    if (!this.clamAv || !this.isInitialized) {
      throw new Error('ClamAV is not initialized');
    }

    return (await this.clamAv.isInfected(filePath)) as {
      file: string;
      isInfected: boolean;
      viruses: [];
    };
  }

  async stopClamAv() {
    if (!this.clamAv) {
      throw new Error('ClamAv instance is not initialized');
    }

    const isClamAVAlive = await this.clamAv.ping();

    if (isClamAVAlive) {
      this.isInitialized = false;
      await this.clamAv.closeAllSockets();
    }
  }

  async stopServer() {
    clamAVServer.stopClamdServer();
  }
}
