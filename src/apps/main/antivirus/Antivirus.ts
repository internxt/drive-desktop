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

// File size limits that match clamd.conf
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

    try {
      const isDaemonRunning = await clamAVServer.checkClamdAvailability();
      if (!isDaemonRunning) {
        Logger.info(
          '[ANTIVIRUS] ClamAV daemon not running, starting it before initialization'
        );
        await clamAVServer.startClamdServer();
        await clamAVServer.waitForClamd();
        Logger.info('[ANTIVIRUS] ClamAV daemon started successfully');
      }
    } catch (daemonError) {
      Logger.error(
        '[ANTIVIRUS] Error checking/starting ClamAV daemon:',
        daemonError
      );
      throw AntivirusError.clamdNotAvailable('Failed to start ClamAV daemon');
    }

    await instance.initialize();
    return instance;
  }

  private async ensureConnection(): Promise<boolean> {
    if (this.clamAv && this.isInitialized) {
      this.connectionRetries = 0;
      return true;
    }

    if (this.connectionRetries >= Antivirus.MAX_RETRIES) {
      Logger.error(
        `[ANTIVIRUS] Max reconnection attempts (${Antivirus.MAX_RETRIES}) reached. Giving up.`
      );
      return false;
    }

    const isDaemonRunning = await clamAVServer.checkClamdAvailability();

    if (!isDaemonRunning) {
      Logger.warn(
        '[ANTIVIRUS] ClamAV daemon is not running, attempting to start it...'
      );
      try {
        await clamAVServer.startClamdServer();
        await clamAVServer.waitForClamd();
        Logger.info('[ANTIVIRUS] Successfully started ClamAV daemon');
      } catch (daemonError) {
        Logger.error('[ANTIVIRUS] Failed to start ClamAV daemon:', daemonError);
        this.connectionRetries++;
        return false;
      }
    }

    this.connectionRetries++;
    Logger.info(
      `[ANTIVIRUS] Attempting to reinitialize ClamAV client (attempt ${this.connectionRetries}/${Antivirus.MAX_RETRIES})`
    );

    try {
      await this.initialize();
      this.connectionRetries = 0;
      return true;
    } catch (error) {
      Logger.error(
        `[ANTIVIRUS] Failed to reinitialize ClamAV client (attempt ${this.connectionRetries}/${Antivirus.MAX_RETRIES})`,
        error
      );
      return false;
    }
  }

  async initialize(): Promise<void> {
    try {
      const isDaemonRunning = await clamAVServer.checkClamdAvailability();
      if (!isDaemonRunning) {
        Logger.warn(
          '[ANTIVIRUS] ClamAV daemon not responding in initialize, attempting restart'
        );
        await clamAVServer.stopClamdServer();

        await new Promise((resolve) => setTimeout(resolve, 1000));

        await clamAVServer.startClamdServer();
        await clamAVServer.waitForClamd();

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

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

      if (
        error instanceof Error &&
        (error.message.includes('ECONNREFUSED') ||
          error.message.includes('connect') ||
          error.message.includes('socket'))
      ) {
        Logger.warn(
          '[ANTIVIRUS] Connection error during initialization, trying emergency daemon restart'
        );

        try {
          clamAVServer.stopClamdServer();
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await clamAVServer.startClamdServer();
          await clamAVServer.waitForClamd(60000); // Extended timeout

          throw AntivirusError.initializationFailed(
            'Connection failed, daemon restarted. Please try again.',
            error
          );
        } catch (restartError) {
          Logger.error(
            '[ANTIVIRUS] Emergency daemon restart failed:',
            restartError
          );
        }
      }

      throw AntivirusError.initializationFailed('Initialization failed', error);
    }
  }

  /**
   * Verify ClamAV connection is still alive with a ping
   * @returns True if connection is alive
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.clamAv || !this.isInitialized) {
      Logger.error(
        '[ANTIVIRUS] Connection verification failed: ClamAV not initialized'
      );
      return false;
    }

    try {
      Logger.debug('[ANTIVIRUS] Verifying ClamAV connection with ping');
      const pingResult = await this.clamAv.ping();
      const isConnected = !!pingResult;

      if (isConnected) {
        Logger.debug('[ANTIVIRUS] ClamAV connection verified successfully');
      } else {
        Logger.warn(
          '[ANTIVIRUS] ClamAV ping succeeded but returned falsy value'
        );
      }

      return isConnected;
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

  /**
   * Scan a file with automatic retry logic for connection failures
   * @param filePath Path to the file to scan
   * @param maxRetries Maximum number of retries on connection failures (default 2)
   * @returns Scan result with infection status
   */
  async scanFileWithRetry(
    filePath: string,
    maxRetries = 2
  ): Promise<{ file: string; isInfected: boolean; viruses: [] }> {
    let retryCount = 0;

    const attemptScan = async (): Promise<{
      file: string;
      isInfected: boolean;
      viruses: [];
    }> => {
      try {
        return await this.scanFile(filePath);
      } catch (error) {
        if (
          retryCount >= maxRetries ||
          !(error instanceof Error) ||
          !(
            error.message.includes('not initialized') ||
            error.message.includes('connection') ||
            error.message.includes('socket') ||
            error.message.includes('ECONNREFUSED') ||
            error.message.toLowerCase().includes('clamd') ||
            error.message.includes('timeout')
          )
        ) {
          throw error;
        }

        retryCount++;
        Logger.warn(
          `[ANTIVIRUS_SCAN] Connection issue detected for ${filePath}, retry ${retryCount}/${maxRetries}`
        );

        await new Promise((resolve) => setTimeout(resolve, 500 * retryCount));
        return attemptScan();
      }
    };

    return attemptScan();
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

    let isConnected = await this.ensureConnection();

    if (!isConnected) {
      Logger.warn(
        `[ANTIVIRUS] Connection failed for ${filePath}, trying with fresh connection attempt`
      );

      try {
        const isDaemonRunning = await clamAVServer.checkClamdAvailability();
        if (!isDaemonRunning) {
          Logger.warn(
            '[ANTIVIRUS] ClamAV daemon not running, attempting to restart'
          );
          await clamAVServer.startClamdServer();
          await clamAVServer.waitForClamd();
          Logger.info(
            '[ANTIVIRUS] Successfully restarted ClamAV daemon for scan'
          );
        }
      } catch (daemonError) {
        Logger.error(
          '[ANTIVIRUS] Failed to restart ClamAV daemon for scan:',
          daemonError
        );
      }

      this.connectionRetries = 0;
      isConnected = await this.ensureConnection();

      if (!isConnected) {
        Logger.error(
          `[ANTIVIRUS] Could not establish ClamAV connection after reset attempt for ${filePath}`
        );
        throw AntivirusError.notInitialized();
      }
    }

    try {
      const pingResult = await this.verifyConnection();
      if (!pingResult) {
        Logger.warn(
          '[ANTIVIRUS] ClamAV connection not responding to ping, attempting to reinitialize'
        );

        const isDaemonRunning = await clamAVServer.checkClamdAvailability();
        if (!isDaemonRunning) {
          Logger.warn(
            '[ANTIVIRUS] ClamAV daemon not running, attempting to restart'
          );
          try {
            await clamAVServer.startClamdServer();
            await clamAVServer.waitForClamd();
          } catch (daemonError) {
            Logger.error('[ANTIVIRUS] Failed to restart daemon:', daemonError);
          }
        }

        this.connectionRetries = 0;
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
          error.message.includes('ECONNREFUSED') ||
          error.message.toLowerCase().includes('not initialized') ||
          error.message.toLowerCase().includes('clamd') ||
          error.message.includes('timeout'))
      ) {
        Logger.warn(
          '[ANTIVIRUS] Connection error detected, attempting to reinitialize ClamAV'
        );
        try {
          const isDaemonRunning = await clamAVServer.checkClamdAvailability();
          if (!isDaemonRunning) {
            Logger.warn(
              '[ANTIVIRUS] ClamAV daemon not running after error, attempting to restart'
            );
            try {
              await clamAVServer.startClamdServer();
              await clamAVServer.waitForClamd();
            } catch (daemonError) {
              Logger.error(
                '[ANTIVIRUS] Failed to restart daemon after scan error:',
                daemonError
              );
              throw AntivirusError.scanFailed(filePath, error);
            }
          }

          this.connectionRetries = 0;
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
