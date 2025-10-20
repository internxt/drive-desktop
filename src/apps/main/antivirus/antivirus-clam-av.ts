import path from 'node:path';
import NodeClam from '@internxt/scan';
import * as clamAVServer from './ClamAVDaemon';
import { app } from 'electron';
import { cwd } from 'node:process';
import { logger } from '@/apps/shared/logger/logger';

export type SelectedItemToScanProps = {
  path: string;
  itemName: string;
  isDirectory: boolean;
};

const RESOURCES_PATH = app.isPackaged ? path.join(process.resourcesPath, 'clamAV') : path.join(cwd(), 'clamAV');

export class AntivirusClamAV {
  private clamAv: NodeClam | null = null;
  private isInitialized = false;

  static async createInstance(): Promise<AntivirusClamAV> {
    const instance = new AntivirusClamAV();
    await instance.initialize();
    return instance;
  }

  async initialize(): Promise<void> {
    try {
      await clamAVServer.checkClamdAvailability();

      this.clamAv = await new NodeClam().init({
        removeInfected: false,
        debugMode: false,
        scanRecursively: true,
        clamdscan: {
          path: path.join(RESOURCES_PATH, 'clamdscan.exe'),
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
      throw logger.error({
        tag: 'ANTIVIRUS',
        msg: 'Error initializing ClamAV',
        exc: error,
      });
    }
  }

  async scanFile({ filePath }: { filePath: string }) {
    if (!this.clamAv || !this.isInitialized) {
      throw new Error('ClamAV is not initialized');
    }

    return await this.clamAv.isInfected(filePath);
  }

  async stop() {
    if (!this.clamAv) {
      throw new Error('ClamAv instance is not initialized');
    }

    const isClamAVAlive = await this.clamAv.ping();

    if (isClamAVAlive) {
      this.isInitialized = false;
      await this.clamAv.closeAllSockets();
    }
  }
}
