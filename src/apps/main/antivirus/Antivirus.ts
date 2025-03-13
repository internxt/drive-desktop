import path from 'path';
import NodeClam from '@internxt/scan';
import clamAVServer from './ClamAVDaemon';
import Logger from 'electron-log';
import { AntivirusError } from './AntivirusError';
import { RESOURCES_PATH, SERVER_HOST, SERVER_PORT } from './constants';
import fs from 'fs';

export interface SelectedItemToScanProps {
  path: string;
  itemName: string;
  isDirectory: boolean;
}

// Define file size limits that match clamd.conf
const FILE_SIZE_LIMITS = {
  MAX_SCAN_SIZE: 400 * 1024 * 1024, // 400M in bytes from clamd.conf
  MAX_FILE_SIZE: 2 * 1024 * 1024 * 1024, // 2G in bytes from clamd.conf
  SCAN_TIMEOUT: 600000, // 600 seconds (10 min) in ms from clamd.conf ReadTimeout
};

export class Antivirus {
  private clamAv: NodeClam | null = null;
  private isInitialized = false;
  private connectionRetries = 0;
  private static MAX_RETRIES = 3;

  private constructor() {
    //
  }

  static async createInstance(): Promise<Antivirus> {
    const instance = new Antivirus();
    await instance.initialize();
    return instance;
  }

  private async ensureConnection(): Promise<boolean> {
    if (!this.clamAv || !this.isInitialized) {
      if (this.connectionRetries < Antivirus.MAX_RETRIES) {
        this.connectionRetries++;
        Logger.info(
          `[ANTIVIRUS] Attempting to reinitialize ClamAV (attempt ${this.connectionRetries})`
        );
        try {
          await this.initialize();
          return true;
        } catch (error) {
          Logger.error(
            `[ANTIVIRUS] Failed to reinitialize ClamAV (attempt ${this.connectionRetries})`,
            error
          );
          return false;
        }
      }
      return false;
    }
    return true;
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
          timeout: FILE_SIZE_LIMITS.SCAN_TIMEOUT,
          multiscan: true,
          active: true,
        },
        preference: 'clamdscan',
      });

      this.isInitialized = true;
      this.connectionRetries = 0;
      Logger.info('[ANTIVIRUS] ClamAV initialized successfully');
    } catch (error) {
      this.isInitialized = false;
      Logger.error('[ANTIVIRUS] Error Initializing ClamAV:', error);
      throw AntivirusError.initializationFailed('Initialization failed', error);
    }
  }

  /**
   * Verify ClamAV connection is still alive with a ping
   * @returns True if connection is alive
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.clamAv || !this.isInitialized) {
      return false;
    }

    try {
      const pingResult = await this.clamAv.ping();
      return !!pingResult;
    } catch (error) {
      Logger.error('[ANTIVIRUS] Error verifying ClamAV connection:', error);
      return false;
    }
  }

  /**
   * Check if a file exists and is accessible
   * @param filePath Path to check
   * @returns True if file exists and is accessible
   */
  private async checkFileAccessible(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
      return true;
    } catch (error) {
      Logger.error(`[ANTIVIRUS] File not accessible: ${filePath}`, error);
      return false;
    }
  }

  async scanFile(
    filePath: string
  ): Promise<{ file: string; isInfected: boolean; viruses: [] }> {
    const isAccessible = await this.checkFileAccessible(filePath);
    if (!isAccessible) {
      throw AntivirusError.scanFailed(
        filePath,
        new Error('File not accessible or not found')
      );
    }

    const isConnected = await this.ensureConnection();
    if (!isConnected) {
      throw AntivirusError.notInitialized();
    }

    try {
      const pingResult = await this.verifyConnection();
      if (!pingResult) {
        Logger.warn(
          '[ANTIVIRUS] ClamAV connection not responding to ping, attempting to reinitialize'
        );
        await this.initialize();
      }

      const scanPromise = this.clamAv!.isInfected(filePath);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Scan timeout exceeded for file: ${filePath}`));
        }, FILE_SIZE_LIMITS.SCAN_TIMEOUT);
      });

      const result = (await Promise.race([scanPromise, timeoutPromise])) as {
        file: string;
        isInfected: boolean;
        viruses: [];
      };

      return result;
    } catch (error) {
      Logger.error(`[ANTIVIRUS] Scan failed for file: ${filePath}`, error);

      if (
        error instanceof Error &&
        (error.message.includes('connection') ||
          error.message.includes('socket') ||
          error.message.includes('ECONNREFUSED'))
      ) {
        Logger.warn(
          '[ANTIVIRUS] Connection error detected, attempting to reinitialize ClamAV'
        );
        try {
          await this.initialize();
          Logger.info(
            '[ANTIVIRUS] Successfully reinitialized ClamAV, retrying scan'
          );

          return (await this.clamAv!.isInfected(filePath)) as {
            file: string;
            isInfected: boolean;
            viruses: [];
          };
        } catch (reinitError) {
          Logger.error(
            '[ANTIVIRUS] Failed to reinitialize ClamAV after connection error',
            reinitError
          );
          throw AntivirusError.scanFailed(filePath, error);
        }
      }

      throw AntivirusError.scanFailed(filePath, error);
    }
  }

  async stopClamAv() {
    if (!this.clamAv) {
      throw AntivirusError.clamAvNotInitialized();
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
