import path from 'path';
import NodeClam from '@internxt/scan';
import clamAVServer from './ClamAVDaemon';
import Logger from 'electron-log';
import { AntivirusError } from './AntivirusError';
import { RESOURCES_PATH, SERVER_HOST, SERVER_PORT } from './constants';

export interface SelectedItemToScanProps {
  path: string;
  itemName: string;
  isDirectory: boolean;
}

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
          host: SERVER_HOST,
          localFallback: false,
          port: SERVER_PORT,
          timeout: 3600000,
          multiscan: true,
          active: true,
        },
        preference: 'clamdscan',
      });

      this.isInitialized = true;
    } catch (error) {
      Logger.error('Error Initializing ClamAV:', error);
      throw AntivirusError.initializationFailed(
        'Failed to initialize ClamAV',
        error
      );
    }
  }

  async scanFile(
    filePath: string
  ): Promise<{ file: string; isInfected: boolean; viruses: [] }> {
    if (!this.clamAv || !this.isInitialized) {
      throw AntivirusError.notInitialized();
    }

    try {
      return (await this.clamAv.isInfected(filePath)) as {
        file: string;
        isInfected: boolean;
        viruses: [];
      };
    } catch (error) {
      throw AntivirusError.scanFailed(filePath, error);
    }
  }

  async stopClamAv() {
    if (!this.clamAv) {
      throw AntivirusError.notInitialized();
    }

    try {
      const isClamAVAlive = await this.clamAv.ping();

      if (isClamAVAlive) {
        this.isInitialized = false;
        await this.clamAv.closeAllSockets();
      }
    } catch (error) {
      throw AntivirusError.unknown('Failed to stop ClamAV', error);
    }
  }

  async stopServer() {
    try {
      clamAVServer.stopClamdServer();
    } catch (error) {
      throw AntivirusError.unknown('Failed to stop ClamAV server', error);
    }
  }
}
