import path from 'path';
import NodeClam from '@internxt/scan';
import clamAVServer from './ClamAVDaemon';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { AntivirusError } from './AntivirusError';
import { RESOURCES_PATH, SERVER_HOST, SERVER_PORT } from './constants';
import { ScanFileResult } from '@internxt/scan';
import fs from 'fs';

export interface SelectedItemToScanProps {
  path: string;
  itemName: string;
  isDirectory: boolean;
}

// File size limits that match clamd.conf
const FILE_SIZE_LIMITS = {
  MAX_SCAN_SIZE: 400 * 1024 * 1024, // 400M in bytes from clamd.conf
  MAX_FILE_SIZE: 2 * 1024 * 1024 * 1024, // 2G in bytes from clamd.conf
  SCAN_TIMEOUT: 600000, // 600 seconds (10 min) in ms from clamd.conf ReadTimeout
};

export class Antivirus {
  private clamAv: NodeClam | null = null;
  private isInitialized = false;

  static async createInstance() {
    const instance = new Antivirus();
    await instance.initialize();
    return instance;
  }

  async initialize(): Promise<void> {
    try {
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
      logger.debug({
        tag: 'ANTIVIRUS',
        msg: 'ClamAV initialized successfully',
      });
    } catch (error) {
      this.isInitialized = false;
      logger.error({
        tag: 'ANTIVIRUS',
        msg: 'Error Initializing ClamAV:',
        error,
      });
    }
  }

  /**
   * Verify ClamAV connection is still alive with a ping
   * @returns True if connection is alive
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.clamAv || !this.isInitialized) {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: 'Connection verification failed: ClamAV not initialized',
      });
      return false;
    }

    try {
      logger.debug({
        tag: 'ANTIVIRUS',
        msg: 'Verifying ClamAV connection with ping',
      });
      const pingResult = await this.clamAv.ping();
      const isConnected = !!pingResult;

      if (isConnected) {
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: 'ClamAV connection verified successfully',
        });
      } else {
        logger.warn({
          tag: 'ANTIVIRUS',
          msg: 'ClamAV ping succeeded but returned falsy value',
        });
      }

      return isConnected;
    } catch (error) {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: 'Error verifying ClamAV connection:',
        error,
      });
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
      logger.error({
        tag: 'ANTIVIRUS',
        msg: `File not accessible: ${filePath}`,
        error,
      });
      return false;
    }
  }

  async scanFileWithRetry(filePath: string, signal: AbortSignal, maxRetries = 2): Promise<ScanFileResult | undefined> {
    let retryCount = 0;

    const attemptScan = async () => {
      if (signal.aborted) return;

      try {
        return await this.scanFile(filePath, signal);
      } catch (error) {
        if (error instanceof Error && error.message.includes('SCAN_TIMEOUT')) {
          logger.warn({
            tag: 'ANTIVIRUS',
            msg: `Skipping file due to timeout: ${filePath}`,
          });

          return {
            file: filePath,
            isInfected: false,
            viruses: [],
          };
        }

        if (
          retryCount >= maxRetries ||
          !(error instanceof Error) ||
          !(
            error.message.includes('not initialized') ||
            error.message.includes('connection') ||
            error.message.includes('socket') ||
            error.message.includes('ECONNREFUSED') ||
            error.message.toLowerCase().includes('clamd')
          )
        ) {
          throw error;
        }

        retryCount++;
        logger.warn({
          tag: 'ANTIVIRUS',
          msg: `[ANTIVIRUS_SCAN] Connection issue detected for ${filePath}, retry ${retryCount}/${maxRetries}`,
        });

        await new Promise((resolve) => setTimeout(resolve, 500 * retryCount));
        return attemptScan();
      }
    };

    return attemptScan();
  }

  async scanFile(filePath: string, signal: AbortSignal, timeout = 60000): Promise<ScanFileResult | undefined> {
    if (!this.clamAv || !this.isInitialized) {
      throw AntivirusError.clamAvNotInitialized();
    }

    const isFileAccessible = await this.checkFileAccessible(filePath);
    if (!isFileAccessible) {
      throw AntivirusError.fileAccessError(filePath);
    }

    if (signal.aborted) return;

    const scanPromise: Promise<ScanFileResult> = this.clamAv.isInfected(filePath);
    const timeoutPromise: Promise<never> = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`SCAN_TIMEOUT: File scan exceeded ${timeout}ms`));
      }, timeout);
    });

    const abortPromise: Promise<undefined> = new Promise((resolve) => {
      signal.addEventListener('abort', () => resolve(undefined));
    });

    const promises = [scanPromise, timeoutPromise, abortPromise];
    try {
      return await Promise.race(promises);
    } catch (error) {
      if (error instanceof Error && error.message.includes('SCAN_TIMEOUT')) {
        logger.warn({
          tag: 'ANTIVIRUS',
          msg: `File scan exceeded timeout (${timeout}ms), skipping: ${filePath}`,
        });

        return {
          file: filePath,
          isInfected: false,
          viruses: [],
        };
      }
      logger.error({
        tag: 'ANTIVIRUS',
        msg: `Error scanning file: ${filePath}`,
        error,
      });
      throw error;
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
