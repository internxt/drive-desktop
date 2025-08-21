import { logger } from '@internxt/drive-desktop-core/build/backend';
import clamAVServer from './ClamAVDaemon';
import { runFreshclam } from './FreshclamUpdater';
import { scheduleDailyScan, clearDailyScan } from './scanCronJob';
import configStore from '../config';
import eventBus from '../event-bus';
import { AvailableProducts } from '@internxt/sdk/dist/drive/payments/types';

/**
 * Manages the initialization, shutdown, and lifecycle
 * of the antivirus functionality based on user's product availability.
 */
export class AntivirusManager {
  private static instance: AntivirusManager;
  private lastAntivirusState: boolean | null = null;

  private constructor() {
    eventBus.on(
      'USER_AVAILABLE_PRODUCTS_UPDATED',
      this.handleProductsUpdate.bind(this)
    );
  }

  /**
   * Get the singleton instance of the AntivirusManager
   */
  public static getInstance(): AntivirusManager {
    if (!AntivirusManager.instance) {
      AntivirusManager.instance = new AntivirusManager();
    }
    return AntivirusManager.instance;
  }

  /**
   * Check if antivirus feature is available for the current user
   */
  private isAntivirusAvailable(): boolean {
    const availableUserProducts = configStore.get('availableUserProducts');
    logger.debug({
      tag: 'ANTIVIRUS',
      msg: `[ANTIVIRUS_MANAGER] Checking if antivirus is available for the current user: ${JSON.stringify(availableUserProducts)}`,
    });
    logger.debug({
      tag: 'ANTIVIRUS',
      msg: `[ANTIVIRUS_MANAGER] Antivirus available: ${Boolean(availableUserProducts && availableUserProducts.antivirus)}`,
    });
    return Boolean(availableUserProducts && availableUserProducts.antivirus);
  }

  /**
   * Check if the ClamAV daemon is currently running
   */
  private async isClamAVRunning(): Promise<boolean> {
    try {
      return await clamAVServer.checkClamdAvailability();
    } catch (error) {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: '[ANTIVIRUS_MANAGER] Error checking ClamAV availability:',
        error,
      });
      return false;
    }
  }

  /**
   * Initialize ClamAV daemon and schedule daily scan if the user has access to antivirus feature
   */
  public async initialize(): Promise<void> {
    try {
      if (!this.isAntivirusAvailable()) {
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: '[ANTIVIRUS_MANAGER] Feature is not available for this user, skipping initialization',
        });
        return;
      }

      const isRunning = await this.isClamAVRunning();
      if (isRunning) {
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: '[ANTIVIRUS_MANAGER] ClamAV is already running, skipping initialization',
        });
        return;
      }

      logger.debug({
        tag: 'ANTIVIRUS',
        msg: '[ANTIVIRUS_MANAGER] Feature is available for this user, initializing ClamAV',
      });

      try {
        await runFreshclam().catch((error) => {
          logger.error({
            tag: 'ANTIVIRUS',
            msg: '[ANTIVIRUS_MANAGER] Failed to run freshclam:',
            error,
          });
        });

        logger.debug({
          tag: 'ANTIVIRUS',
          msg: '[ANTIVIRUS_MANAGER] Starting ClamAV daemon after freshclam...',
        });
        await clamAVServer.startClamdServer();
        await clamAVServer.waitForClamd(300000, 10000);
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: '[ANTIVIRUS_MANAGER] ClamAV daemon is ready',
        });

        scheduleDailyScan();
      } catch (error) {
        logger.error({
          tag: 'ANTIVIRUS',
          msg: '[ANTIVIRUS_MANAGER] Failed to initialize ClamAV:',
          error,
        });
      }
    } catch (error) {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: '[ANTIVIRUS_MANAGER] Error during initialization:',
        error,
      });
    }
  }

  /**
   * Shutdown ClamAV daemon and clear daily scans
   */
  public async shutdown(): Promise<void> {
    try {
      logger.debug({
        tag: 'ANTIVIRUS',
        msg: '[ANTIVIRUS_MANAGER] Shutting down ClamAV',
      });
      clearDailyScan();
      await clamAVServer.stopClamdServer();
    } catch (error) {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: '[ANTIVIRUS_MANAGER] Error shutting down ClamAV:',
        error,
      });
    }
  }

  /**
   * Handle product updates by starting/stopping ClamAV based on availability
   */
  private async handleProductsUpdate(
    products: AvailableProducts['featuresPerService']
  ): Promise<void> {
    try {
      const isAntivirusEnabled = !!(products && products.antivirus);
      
      // Only proceed if antivirus state has actually changed
      if (this.lastAntivirusState === isAntivirusEnabled) {
        return;
      }

      this.lastAntivirusState = isAntivirusEnabled;
      const isClamRunning = await this.isClamAVRunning();

      if (isAntivirusEnabled && !isClamRunning) {
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: '[ANTIVIRUS_MANAGER] Feature became available, initializing ClamAV',
        });
        await this.initialize();
      } else if (!isAntivirusEnabled && isClamRunning) {
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: '[ANTIVIRUS_MANAGER] Feature no longer available, shutting down ClamAV',
        });
        await this.shutdown();
      }
    } catch (error) {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: '[ANTIVIRUS_MANAGER] Error handling product updates:',
        error,
      });
    }
  }
}

// Export a function to get the singleton instance
export function getAntivirusManager(): AntivirusManager {
  return AntivirusManager.getInstance();
}
